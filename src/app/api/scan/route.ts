import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TOKEN_COSTS } from "@/lib/tokens"

const SCRAPER_URL = process.env.SCRAPER_API_URL || "http://159.69.127.36:8899"
const SCRAPER_KEY = process.env.SCRAPER_API_KEY || "tbs-scraper-2026-secret"

type ScrapedProduct = {
  name: string
  description: string | null
  price: string | null
  image_url: string | null
  url: string | null
  category: string | null
}

async function scrapeWithServer(url: string, maxProducts = 50): Promise<{
  siteName: string
  siteDescription: string
  products: ScrapedProduct[]
  method: string
}> {
  const resp = await fetch(`${SCRAPER_URL}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SCRAPER_KEY,
    },
    body: JSON.stringify({ url, max_products: maxProducts, wait_seconds: 4 }),
    signal: AbortSignal.timeout(90000),
  })

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({ detail: "Scraper unavailable" }))
    throw new Error(errData.detail || `Scraper error: ${resp.status}`)
  }

  const data = await resp.json()
  return {
    siteName: data.site_name || new URL(url).hostname,
    siteDescription: data.site_description || "",
    products: data.products || [],
    method: data.method || "unknown",
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const body = await request.json()
  const { url, brandId, mode } = body

  if (!url) {
    return NextResponse.json({ error: "URL-ul este obligatoriu" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tokens < TOKEN_COSTS.SCAN_WEBSITE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  try {
    const { siteName, siteDescription, products: scraped, method } = await scrapeWithServer(url)
    console.log(`[scan] ${url} → ${scraped.length} products via ${method}`)

    const limitedProducts = scraped.slice(0, 50)

    // For rescan mode: update existing brand + replace products
    if (mode === "rescan" && brandId) {
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("id", brandId)
        .eq("user_id", user.id)
        .single()

      if (!existingBrand) {
        return NextResponse.json({ error: "Brand negasit" }, { status: 404 })
      }

      await supabase.from("products").delete().eq("brand_id", brandId)
      await supabase.from("brands").update({
        last_scan_at: new Date().toISOString(),
      }).eq("id", brandId)

      if (limitedProducts.length > 0) {
        await supabase.from("products").insert(
          limitedProducts.map(p => ({ ...p, brand_id: brandId }))
        )
      }

      const newBalance = profile.tokens - TOKEN_COSTS.SCAN_WEBSITE
      await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
      await supabase.from("token_transactions").insert({
        user_id: user.id,
        amount: -TOKEN_COSTS.SCAN_WEBSITE,
        type: "consumption",
        description: `Rescan: ${url}`,
        reference_id: brandId,
        balance_after: newBalance,
      })

      await supabase.from("scan_history").insert({
        brand_id: brandId,
        user_id: user.id,
        url,
        products_found: limitedProducts.length,
        status: "completed",
        tokens_used: TOKEN_COSTS.SCAN_WEBSITE,
      })

      return NextResponse.json({
        brandId,
        productsFound: limitedProducts.length,
        mode: "rescan",
      })
    }

    // New brand mode
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .insert({
        user_id: user.id,
        name: siteName,
        url: url,
        description: siteDescription,
        last_scan_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (brandError) throw brandError

    if (limitedProducts.length > 0) {
      await supabase.from("products").insert(
        limitedProducts.map(p => ({ ...p, brand_id: brand.id }))
      )
    }

    const newBalance = profile.tokens - TOKEN_COSTS.SCAN_WEBSITE
    await supabase.from("profiles").update({ tokens: newBalance }).eq("id", user.id)
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      amount: -TOKEN_COSTS.SCAN_WEBSITE,
      type: "consumption",
      description: `Scanare website: ${siteName}`,
      reference_id: brand.id,
      balance_after: newBalance,
    })

    await supabase.from("scan_history").insert({
      brand_id: brand.id,
      user_id: user.id,
      url,
      products_found: limitedProducts.length,
      status: "completed",
      tokens_used: TOKEN_COSTS.SCAN_WEBSITE,
    })

    return NextResponse.json({
      brandId: brand.id,
      brandName: siteName,
      productsFound: limitedProducts.length,
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json({ error: "Eroare la scanarea website-ului" }, { status: 500 })
  }
}
