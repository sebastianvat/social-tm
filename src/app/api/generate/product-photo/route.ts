import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TOKEN_COSTS } from "@/lib/tokens"

const MOLTY_URL = process.env.SCRAPER_API_URL || "https://molty.transilvaniabusinesssuite.ro/scraper"
const MOLTY_KEY = process.env.SCRAPER_API_KEY || "tbs-scraper-2026-secret"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { productId, productName, productDescription, productCategory, productImageUrl, style = "room" } = await request.json()

  const { data: profile } = await supabase.from("profiles").select("tokens").eq("id", user.id).single()
  if (!profile || profile.tokens < TOKEN_COSTS.GENERATE_IMAGE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  try {
    const baseUrl = MOLTY_URL.replace(/\/scraper\/?$/, "")
    const genUrl = `${baseUrl}/scraper/generate-image`

    const moltyResp = await fetch(genUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MOLTY_KEY,
      },
      body: JSON.stringify({
        product_name: productName,
        product_description: productDescription || "",
        product_category: productCategory || "",
        product_image_url: productImageUrl || "",
        style,
        google_ai_api_key: process.env.GOOGLE_AI_API_KEY!,
      }),
    })

    if (!moltyResp.ok) {
      const errData = await moltyResp.json().catch(() => ({ detail: "Eroare server generare" }))
      return NextResponse.json({ error: errData.detail || "Eroare generare" }, { status: moltyResp.status })
    }

    const data = await moltyResp.json()
    const buffer = Buffer.from(data.image_base64, "base64")
    const mimeType = data.mime_type || "image/png"

    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png"
    const fileName = `${user.id}/product-studio/${productId || crypto.randomUUID()}-${style}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(fileName, buffer, { contentType: mimeType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: "Eroare upload: " + uploadError.message }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from("post-images").getPublicUrl(fileName)

    const newBalance = profile.tokens - TOKEN_COSTS.GENERATE_IMAGE
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -TOKEN_COSTS.GENERATE_IMAGE,
      type: "consumption",
      description: `Product Studio: ${productName?.slice(0, 40)}`,
      reference_id: productId || null,
      balance_after: newBalance,
    })

    return NextResponse.json({ imageUrl: publicUrl.publicUrl, style })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Eroare generare" }, { status: 500 })
  }
}
