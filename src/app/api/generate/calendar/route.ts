import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function POST(request: NextRequest) {
  const anthropic = new Anthropic()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const { brandId, month, year, postCount = 30, platforms = ["facebook", "instagram"], selectedProductIds = [] } = await request.json()

  // Check token balance
  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  const totalCost = TOKEN_COSTS.GENERATE_CALENDAR
  
  if (!profile || profile.tokens < totalCost) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  // Get brand + products
  const { data: brand } = await supabase.from("brands").select("*").eq("id", brandId).eq("user_id", user.id).single()
  if (!brand) {
    return NextResponse.json({ error: "Brand negasit" }, { status: 404 })
  }

  let productsQuery = supabase.from("products").select("*").eq("brand_id", brandId)
  if (selectedProductIds.length > 0) {
    productsQuery = productsQuery.in("id", selectedProductIds)
  }
  const { data: products } = await productsQuery.limit(50)

  const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"]

  const productsList = products?.map((p, i) => `[PRODUS_${i}] ${p.name}${p.description ? `: ${p.description}` : ""}${p.price ? ` (${p.price})` : ""}`).join("\n") || "Nu au fost gasite produse specifice."

  try {
    const prompt = `Esti un expert in social media marketing. Creeaza un calendar de continut pentru luna ${months[month - 1]} ${year}.

BRAND: ${brand.name}
WEBSITE: ${brand.url}
DESCRIERE: ${brand.description || "N/A"}
${brand.brand_voice ? `TONUL BRANDULUI: ${brand.brand_voice}` : ""}

PRODUSE SELECTATE PENTRU PROMOVARE:
${productsList}

PLATFORME: ${platforms.join(", ")}

Genereaza exact ${postCount} postari distribuite uniform pe luna, cu mix de:
- 40% Promo (produse, oferte, CTA puternic)
- 25% Educational (tips, how-to, valoare pentru audienta)
- 20% Engagement (intrebari, polls, conversatie)
- 15% Brand Story (behind the scenes, echipa, valori)

IMPORTANT: Postarile promo trebuie sa promoveze produsele selectate. Distribuie postarile promo pe produsele disponibile.

Pentru fiecare postare returneza un JSON object cu aceste campuri:
- day: numarul zilei din luna (1-${new Date(year, month, 0).getDate()})
- content: textul postarii (150-300 caractere, in romana)
- hashtags: array de 5-8 hashtags relevante
- post_type: "promo" | "educational" | "engagement" | "brand_story"
- platform: una din platformele specificate
- image_prompt: descriere in engleza pentru generarea imaginii AI (50-100 cuvinte, descriptiv, include stil vizual)
- best_time: ora optima de postare (format "HH:MM")
- product_index: indexul produsului asociat (0, 1, 2, ...) sau null daca postarea nu e despre un produs specific

Raspunde DOAR cu un JSON array valid. Fara explicatii, fara markdown.`

    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    })

    const responseText = message.content[0].type === "text" ? message.content[0].text : ""
    
    let posts
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      posts = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch {
      return NextResponse.json({ error: "Eroare la parsarea raspunsului AI" }, { status: 500 })
    }

    // Create calendar
    const { data: calendar, error: calError } = await supabase
      .from("content_calendars")
      .insert({
        brand_id: brandId,
        user_id: user.id,
        month,
        year,
        status: "draft",
        post_count: posts.length,
      })
      .select()
      .single()

    if (calError) throw calError

    // Save posts — link product_id based on product_index from Claude
    const postRecords = posts.map((p: any) => {
      let productId = null
      if (p.product_index != null && products && products[p.product_index]) {
        productId = products[p.product_index].id
      }
      return {
        calendar_id: calendar.id,
        brand_id: brandId,
        user_id: user.id,
        content: p.content,
        hashtags: p.hashtags || [],
        image_prompt: p.image_prompt || null,
        post_type: p.post_type || "promo",
        platform: p.platform || platforms[0],
        scheduled_at: new Date(year, month - 1, p.day, ...((p.best_time || "10:00").split(":").map(Number))).toISOString(),
        status: "draft",
        product_id: productId,
        tokens_used: 0,
      }
    })

    await supabase.from("posts").insert(postRecords)

    // Deduct tokens
    const newBalance = profile.tokens - totalCost
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -totalCost,
      type: "consumption",
      description: `Calendar ${months[month - 1]} ${year} — ${brand.name}`,
      reference_id: calendar.id,
      balance_after: newBalance,
    })

    return NextResponse.json({
      calendarId: calendar.id,
      postCount: posts.length,
      tokensUsed: totalCost,
    })
  } catch (error) {
    console.error("Generate error:", error)
    return NextResponse.json({ error: "Eroare la generarea calendarului" }, { status: 500 })
  }
}
