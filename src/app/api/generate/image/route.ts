import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TOKEN_COSTS } from "@/lib/tokens"

const MOLTY_URL = process.env.SCRAPER_API_URL || "https://molty.transilvaniabusinesssuite.ro/scraper"
const MOLTY_KEY = process.env.SCRAPER_API_KEY || "tbs-scraper-2026-secret"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { postId, prompt } = await request.json()

  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  if (!profile || profile.tokens < TOKEN_COSTS.GENERATE_IMAGE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  try {
    let productName = ""
    let productDescription = ""
    let productCategory = ""
    let productImageUrl = ""

    if (postId) {
      const { data: post } = await supabase
        .from("posts")
        .select("product_id, products:product_id(name, description, category, price, image_url)")
        .eq("id", postId)
        .single()

      if (post?.products && typeof post.products === "object" && "name" in post.products) {
        const p = post.products as { name: string; description?: string; category?: string; price?: string; image_url?: string }
        productName = p.name
        productDescription = p.description || ""
        productCategory = p.category || ""
        productImageUrl = p.image_url || ""
      }
    }

    const fullDesc = productName
      ? `${prompt}\nProduct: ${productName}${productCategory ? ` (${productCategory})` : ""}${productDescription ? `\n${productDescription.slice(0, 200)}` : ""}`
      : prompt

    const baseUrl = MOLTY_URL.replace(/\/scraper\/?$/, "")

    const moltyResp = await fetch(`${baseUrl}/scraper/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": MOLTY_KEY },
      body: JSON.stringify({
        product_name: productName || "Social media post",
        product_description: fullDesc,
        product_category: productCategory,
        product_image_url: productImageUrl,
        style: "room",
        google_ai_api_key: process.env.GOOGLE_AI_API_KEY!,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        storage_path: `${user.id}/${postId || crypto.randomUUID()}`,
      }),
    })

    if (!moltyResp.ok) {
      const err = await moltyResp.json().catch(() => ({ detail: "Eroare generare" }))
      return NextResponse.json({ error: err.detail || "Eroare generare" }, { status: moltyResp.status })
    }

    const data = await moltyResp.json()
    const imageUrl = data.image_url

    if (postId) {
      await supabase.from("posts").update({
        image_url: imageUrl,
        image_prompt: prompt,
        tokens_used: TOKEN_COSTS.GENERATE_IMAGE,
      }).eq("id", postId).eq("user_id", user.id)
    }

    const newBalance = profile.tokens - TOKEN_COSTS.GENERATE_IMAGE
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -TOKEN_COSTS.GENERATE_IMAGE,
      type: "consumption",
      description: "Generare imagine AI (Nano Banana 2)",
      reference_id: postId || null,
      balance_after: newBalance,
    })

    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Eroare generare" }, { status: 500 })
  }
}
