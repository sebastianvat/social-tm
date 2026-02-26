import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as cheerio from "cheerio"
import { TOKEN_COSTS } from "@/lib/tokens"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ error: "URL-ul este obligatoriu" }, { status: 400 })
  }

  // Check token balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", user.id)
    .single()

  if (!profile || profile.tokens < TOKEN_COSTS.SCAN_WEBSITE) {
    return NextResponse.json({ error: "Tokeni insuficienti" }, { status: 402 })
  }

  try {
    // Fetch the website
    const response = await fetch(url, {
      headers: { "User-Agent": "SocialTM Bot/1.0" },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Nu s-a putut accesa website-ul" }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract site info
    const siteName = $('meta[property="og:site_name"]').attr("content") ||
      $("title").text().split("|")[0].split("-")[0].trim() ||
      new URL(url).hostname

    const siteDescription = $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") || ""

    // Create brand
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

    // Extract products (common e-commerce patterns)
    const products: Array<{ name: string; description: string | null; price: string | null; image_url: string | null; url: string | null }> = []

    // Try structured data first (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "")
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "ItemPage") {
            products.push({
              name: item.name || "",
              description: item.description || null,
              price: item.offers?.price?.toString() || null,
              image_url: typeof item.image === "string" ? item.image : item.image?.[0] || null,
              url: item.url || null,
            })
          }
        }
      } catch {}
    })

    // Fallback: common product selectors
    if (products.length === 0) {
      const selectors = [
        ".product", ".product-card", ".product-item",
        "[data-product]", ".wc-block-grid__product",
        ".card-product", ".item-product",
      ]

      for (const selector of selectors) {
        $(selector).each((_, el) => {
          const $el = $(el)
          const name = $el.find("h2, h3, .product-title, .product-name, .card-title").first().text().trim()
          if (name) {
            products.push({
              name,
              description: $el.find(".description, .product-description, p").first().text().trim() || null,
              price: $el.find(".price, .product-price, .amount").first().text().trim() || null,
              image_url: $el.find("img").first().attr("src") || null,
              url: $el.find("a").first().attr("href") || null,
            })
          }
        })
        if (products.length > 0) break
      }
    }

    // Final fallback: extract main content sections
    if (products.length === 0) {
      $("h2, h3").each((_, el) => {
        const name = $(el).text().trim()
        if (name && name.length > 3 && name.length < 100) {
          const nextP = $(el).next("p").text().trim()
          products.push({
            name,
            description: nextP || null,
            price: null,
            image_url: $(el).parent().find("img").first().attr("src") || null,
            url: null,
          })
        }
      })
    }

    // Limit and resolve image URLs
    const limitedProducts = products.slice(0, 50).map(p => ({
      ...p,
      image_url: p.image_url ? new URL(p.image_url, url).href : null,
      url: p.url ? new URL(p.url, url).href : null,
    }))

    // Save products
    if (limitedProducts.length > 0) {
      await supabase.from("products").insert(
        limitedProducts.map(p => ({ ...p, brand_id: brand.id }))
      )
    }

    // Deduct tokens
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

    // Log scan
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
