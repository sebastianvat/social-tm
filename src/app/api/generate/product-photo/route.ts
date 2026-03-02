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

  const jobId = crypto.randomUUID()

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

  const baseUrl = MOLTY_URL.replace(/\/scraper\/?$/, "")

  // Ensure request is delivered to Molty, then abort to free Worker early.
  // Molty continues processing and writes result to Supabase Storage.
  const controller = new AbortController()
  const deliveryTimeout = setTimeout(() => controller.abort(), 8000)

  try {
    await fetch(`${baseUrl}/scraper/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": MOLTY_KEY },
      signal: controller.signal,
      body: JSON.stringify({
        product_name: productName,
        product_description: productDescription || "",
        product_category: productCategory || "",
        product_image_url: productImageUrl || "",
        style,
        google_ai_api_key: process.env.GOOGLE_AI_API_KEY!,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        storage_path: `${user.id}/product-studio/${productId || crypto.randomUUID()}`,
        job_id: jobId,
      }),
    })
  } catch {
    // AbortError expected after 8s — request body already delivered to Molty
  } finally {
    clearTimeout(deliveryTimeout)
  }

  return NextResponse.json({ jobId, style })
}
