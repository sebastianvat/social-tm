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

    function getImgSrc($img: ReturnType<typeof $>): string | null {
      return $img.attr("src") || $img.attr("data-src") || $img.attr("data-srcset")?.split(",")[0]?.trim()?.split(" ")[0] || $img.attr("srcset")?.split(",")[0]?.trim()?.split(" ")[0] || $img.attr("data-lazy-src") || $img.attr("data-original") || null
    }

    function cleanPrice(raw: string | null): string | null {
      if (!raw) return null
      const match = raw.match(/[\d.,]+\s*(lei|ron|eur|€|\$|usd)/i)
      return match ? match[0].trim() : null
    }

    const products: Array<{ name: string; description: string | null; price: string | null; image_url: string | null; url: string | null }> = []

    // Try structured data first (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = JSON.parse($(el).html() || "")
        const items = Array.isArray(raw) ? raw : raw["@graph"] ? raw["@graph"] : [raw]
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "ItemPage") {
            products.push({
              name: item.name || "",
              description: item.description || null,
              price: item.offers?.price?.toString() || item.offers?.lowPrice?.toString() || null,
              image_url: typeof item.image === "string" ? item.image : Array.isArray(item.image) ? item.image[0] : item.image?.url || null,
              url: item.url || null,
            })
          }
          if (item["@type"] === "ItemList" && item.itemListElement) {
            for (const li of item.itemListElement) {
              const p = li.item || li
              if (p.name) {
                products.push({
                  name: p.name,
                  description: p.description || null,
                  price: p.offers?.price?.toString() || null,
                  image_url: typeof p.image === "string" ? p.image : Array.isArray(p.image) ? p.image[0] : p.image?.url || null,
                  url: p.url || null,
                })
              }
            }
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
        ".grid-product", ".product-grid-item",
        ".collection-product", "product-card",
        ".card--product", ".productCard",
      ]

      for (const selector of selectors) {
        $(selector).each((_, el) => {
          const $el = $(el)
          const name = $el.find("h2, h3, h4, .product-title, .product-name, .card-title, .product__title, [class*='title']").first().text().trim()
          if (name && name.length > 2) {
            const $img = $el.find("img").first()
            products.push({
              name,
              description: $el.find(".description, .product-description, p").first().text().trim() || null,
              price: cleanPrice($el.find(".price, .product-price, .amount, .money, [class*='price']").first().text()),
              image_url: getImgSrc($img),
              url: $el.find("a").first().attr("href") || null,
            })
          }
        })
        if (products.length > 0) break
      }
    }

    // Shopify-specific: try product JSON from page
    if (products.length === 0) {
      const shopifyJson = $('script:contains("var meta")').html() || $('script:contains("Shopify.theme")').html()
      if (shopifyJson) {
        $(".grid__item, .collection-product-card, .product-card-wrapper").each((_, el) => {
          const $el = $(el)
          const name = $el.find("a, h3, h2, .card-information__text").first().text().trim()
          const $img = $el.find("img").first()
          if (name && name.length > 2) {
            products.push({
              name,
              description: null,
              price: cleanPrice($el.find(".price, .money, .price-item, [class*='price']").first().text()),
              image_url: getImgSrc($img),
              url: $el.find("a").first().attr("href") || null,
            })
          }
        })
      }
    }

    // Final fallback: extract main content sections
    if (products.length === 0) {
      $("h2, h3").each((_, el) => {
        const name = $(el).text().trim()
        if (name && name.length > 3 && name.length < 100) {
          const nextP = $(el).next("p").text().trim()
          const $parent = $(el).parent()
          const $img = $parent.find("img").first()
          products.push({
            name,
            description: nextP || null,
            price: null,
            image_url: getImgSrc($img),
            url: null,
          })
        }
      })
    }

    // Deduplicate by name
    const seen = new Set<string>()
    const uniqueProducts = products.filter(p => {
      const key = p.name.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Limit and resolve URLs
    const limitedProducts = uniqueProducts.slice(0, 50).map(p => {
      let imgUrl = p.image_url
      if (imgUrl) {
        if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl
        try { imgUrl = new URL(imgUrl, url).href } catch { imgUrl = null }
      }
      let prodUrl = p.url
      if (prodUrl) {
        try { prodUrl = new URL(prodUrl, url).href } catch { prodUrl = null }
      }
      return { ...p, image_url: imgUrl, url: prodUrl, price: p.price || cleanPrice(p.price) }
    })

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
