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
  const daysInMonth = new Date(year, month, 0).getDate()

  const productsList = products?.map((p, i) => `[P${i}] ${p.name}${p.price ? ` — ${p.price}` : ""}${p.category ? ` [${p.category}]` : ""}${p.description ? ` | ${p.description.slice(0, 120)}` : ""}`).join("\n") || "Niciun produs selectat."

  const platformRules: Record<string, string> = {
    instagram: "Instagram: Hook puternic in primele 125 chars (vizibile inainte de 'more'). 400-800 chars total. CTA intrebare la final. Emoji moderat (1-3). Hashtag-uri SEPARATE (nu in corp). Ton conversational.",
    facebook: "Facebook: Text mai lung (500-1200 chars). Storytelling sau value-first. Link in text permis. Emoji minimal. 3-5 hashtag-uri la final. Ton cald, comunitar.",
    linkedin: "LinkedIn: Profesional dar uman. Hook puternic in primele 2 linii. 600-1500 chars. Insight sau lectie. 3-5 hashtag-uri la final. Ton expert, thought-leader.",
    tiktok: "TikTok: Scurt, direct, trend-aware. 200-400 chars. Limbaj Gen Z friendly. Emoji OK. 3-5 hashtag-uri trending. Ton energic, fun."
  }
  const activePlatformRules = platforms.map((p: string) => platformRules[p] || "").filter(Boolean).join("\n")

  try {
    const systemPrompt = `Esti SOCIAL STRATEGIST — un expert in social media marketing cu 12 ani experienta in piata romaneasca. Ai gestionat branduri din e-commerce, servicii si retail. Stilul tau: creativ, data-driven, adaptat culturii romanesti.

REGULI ABSOLUTE:
- Scrii DOAR in limba romana (nu romana cu diacritice obligatorii, dar corecta gramatical)
- Fiecare postare trebuie sa fie UNICA — niciodata doua postari cu acelasi hook sau structura
- Variaza stilul: intrebare, afirmatie puternica, storytelling, lista, citat, controversa blanda
- NU repeta cuvinte-cheie in postari consecutive
- Fiecare image_prompt trebuie sa fie specific, vizual, actionabil — NU generic
- Postarile promo nu suna ca reclame — suna ca recomandari de la un prieten expert`

    const prompt = `Creeaza un calendar de continut pentru ${months[month - 1]} ${year} (${daysInMonth} zile).

═══ PROFIL BRAND ═══
Nume: ${brand.name}
Website: ${brand.url}
${brand.description ? `Descriere: ${brand.description}` : ""}
${brand.brand_voice ? `Voce brand: ${brand.brand_voice}` : ""}
${brand.tone ? `Ton comunicare: ${brand.tone}` : ""}
${brand.target_audience ? `Audienta tinta: ${brand.target_audience}` : ""}
${brand.content_pillars?.length ? `Piloni continut: ${brand.content_pillars.join(" | ")}` : ""}
${brand.visual_style ? `Stil vizual: ${brand.visual_style}` : ""}
${brand.posting_rules ? `Reguli DO/DON'T:\n${brand.posting_rules}` : ""}
${brand.competitor_notes ? `Context competitiv: ${brand.competitor_notes}` : ""}

═══ PRODUSE PENTRU PROMOVARE ═══
${productsList}

═══ REGULI PER PLATFORMA ═══
${activePlatformRules}

═══ MIX CONTINUT (${postCount} postari) ═══
- 40% Promo — promoveaza produsele selectate, CTA subtil dar clar, beneficii nu features
- 25% Educational — tips practice, how-to, myth-busting relevant pentru audienta
- 20% Engagement — intrebari deschise, "tu ce preferi?", polls, conversatie reala
- 15% Brand Story — behind the scenes, valori, echipa, procesul de creatie

Distribuie egal pe ${daysInMonth} zile. Alterna tipurile — NICIODATA 2 postari promo consecutive.

═══ FORMAT IMAGINE (IMPORTANT — pt Gemini image model) ═══
image_prompt TREBUIE sa fie in ENGLEZA si sa urmeze acest format:
"[Photography/illustration style], [subject description with specific details], [composition and framing], [lighting and mood], [color palette], [brand elements if relevant]. High quality, commercial grade."

Exemplu BUN: "Flat lay product photography, artisan coffee beans in a ceramic bowl on a marble countertop, warm morning sunlight from left, soft shadows, earth tones with cream and dark brown, minimalist composition, no text. High quality, 4K."
Exemplu RAU: "A nice picture of coffee" (PREA VAGA)

═══ EXEMPLU OUTPUT (1 postare) ═══
{"day":3,"content":"Stiai ca 73% dintre romani isi incep dimineata fara un ritual? ☕ Noi credem ca o cafea buna nu e un lux — e un act de self-care. Iar [Produs] transforma fiecare dimineata intr-un moment doar al tau. Ce ritual ai tu dimineata? Spune-ne in comentarii 👇","hashtags":["#RitualDeDimineata","#CafeaSpeciala","#SelfCare","#${brand.name.replace(/\s+/g, "")}","#MomentulTau"],"post_type":"engagement","platform":"instagram","image_prompt":"Overhead flat lay photography, steaming artisan coffee in handmade ceramic mug on wooden table, fresh pastry and open book beside it, warm golden morning light streaming from window, cozy earth tones with cream and amber, lifestyle composition, no text overlay. High quality, commercial photography.","best_time":"08:30","product_index":0}

═══ CERINTA FINALA ═══
Genereaza EXACT ${postCount} postari ca JSON array valid.
Fiecare obiect: day, content, hashtags, post_type, platform, image_prompt, best_time, product_index.
- day: 1-${daysInMonth}
- product_index: indexul din lista produselor (0, 1, 2...) sau null
- best_time: "HH:MM" (variaza: 08:00-10:00 dimineata, 12:00-13:00 pranz, 18:00-21:00 seara)
- hashtags: include MEREU 1-2 hashtag-uri branduite (#${brand.name.replace(/\s+/g, "")})
- content: respecta lungimea per platforma!

RASPUNDE DOAR CU JSON ARRAY. Fara text, fara markdown, fara explicatii.`

    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    })

    const responseText = message.content[0].type === "text" ? message.content[0].text : ""
    
    if (!responseText) {
      return NextResponse.json({ error: "Claude nu a returnat text. Stop reason: " + message.stop_reason }, { status: 500 })
    }

    let posts
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return NextResponse.json({ error: "AI nu a returnat JSON valid. Inceput raspuns: " + responseText.slice(0, 200) }, { status: 500 })
      }
      posts = JSON.parse(jsonMatch[0])
    } catch (parseErr: any) {
      return NextResponse.json({ error: "JSON parse error: " + (parseErr?.message || "unknown").slice(0, 200) }, { status: 500 })
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
  } catch (error: any) {
    console.error("Generate error:", error)
    const msg = error?.message || error?.toString() || "Eroare necunoscuta"
    return NextResponse.json({ error: `Eroare generare: ${msg.slice(0, 300)}` }, { status: 500 })
  }
}
