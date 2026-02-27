import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as cheerio from "cheerio"
import { TOKEN_COSTS } from "@/lib/tokens"

function getImgSrc($img: ReturnType<ReturnType<typeof cheerio.load>>): string | null {
  return (
    $img.attr("src") ||
    $img.attr("data-src") ||
    $img.attr("data-srcset")?.split(",")[0]?.trim()?.split(" ")[0] ||
    $img.attr("srcset")?.split(",")[0]?.trim()?.split(" ")[0] ||
    $img.attr("data-lazy-src") ||
    $img.attr("data-original") ||
    $img.attr("data-image") ||
    null
  )
}

function cleanPrice(raw: string | null | undefined): string | null {
  if (!raw) return null
  const normalized = raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
  const match = normalized.match(/([\d.,]+)\s*(lei|ron|eur|€|\$|usd)/i)
  if (match) return `${match[1]} ${match[2]}`
  const numOnly = normalized.match(/^[\d.,]+$/)
  if (numOnly) return numOnly[0]
  return null
}

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 200)
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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SocialTMBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Nu s-a putut accesa website-ul" }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const siteName = $('meta[property="og:site_name"]').attr("content") ||
      $("title").text().split("|")[0].split("-")[0].trim() ||
      new URL(url).hostname

    const siteDescription = $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") || ""

    const products: Array<{
      name: string
      description: string | null
      price: string | null
      image_url: string | null
      url: string | null
      category: string | null
    }> = []

    // 1. JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = JSON.parse($(el).html() || "")
        const items = Array.isArray(raw) ? raw : raw["@graph"] ? raw["@graph"] : [raw]
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "ItemPage") {
            const priceVal = item.offers?.price || item.offers?.lowPrice
            const currency = item.offers?.priceCurrency || "LEI"
            products.push({
              name: cleanName(item.name || ""),
              description: item.description?.slice(0, 300) || null,
              price: priceVal ? `${priceVal} ${currency}` : null,
              image_url: typeof item.image === "string" ? item.image : Array.isArray(item.image) ? item.image[0] : item.image?.url || null,
              url: item.url || null,
              category: item.category || null,
            })
          }
          if (item["@type"] === "ItemList" && item.itemListElement) {
            for (const li of item.itemListElement) {
              const p = li.item || li
              if (p.name) {
                const priceVal = p.offers?.price || p.offers?.lowPrice
                const currency = p.offers?.priceCurrency || "LEI"
                products.push({
                  name: cleanName(p.name),
                  description: p.description?.slice(0, 300) || null,
                  price: priceVal ? `${priceVal} ${currency}` : null,
                  image_url: typeof p.image === "string" ? p.image : Array.isArray(p.image) ? p.image[0] : p.image?.url || null,
                  url: p.url || null,
                  category: null,
                })
              }
            }
          }
        }
      } catch {}
    })

    // 2. Common product selectors
    if (products.length === 0) {
      const selectors = [
        ".product", ".product-card", ".product-item",
        "[data-product]", ".wc-block-grid__product",
        ".card-product", ".item-product",
        ".grid-product", ".product-grid-item",
        ".collection-product", "product-card",
        ".card--product", ".productCard",
        ".product-miniature", ".product-layout",
      ]

      for (const selector of selectors) {
        $(selector).each((_, el) => {
          const $el = $(el)
          const name = $el.find("h2, h3, h4, .product-title, .product-name, .card-title, .product__title, [class*='title']").first().text().trim()
          if (name && name.length > 2) {
            const $img = $el.find("img").first()
            const priceEl = $el.find(".price ins, .price .amount, .price-new, .special-price, [class*='sale-price']").first()
            const priceText = priceEl.length ? priceEl.text() : $el.find(".price, .product-price, .amount, .money, [class*='price']").first().contents().first().text()
            products.push({
              name: cleanName(name),
              description: $el.find(".description, .product-description, .product-excerpt").first().text().trim().slice(0, 300) || null,
              price: cleanPrice(priceText),
              image_url: getImgSrc($img),
              url: $el.find("a").first().attr("href") || null,
              category: null,
            })
          }
        })
        if (products.length > 0) break
      }
    }

    // 3. Shopify-specific
    if (products.length === 0) {
      const isShopify = $('script:contains("Shopify")').length > 0 || $('link[href*="shopify"]').length > 0
      if (isShopify) {
        $(".grid__item, .collection-product-card, .product-card-wrapper, .product-card, .grid-product").each((_, el) => {
          const $el = $(el)
          const name = $el.find(".card-information__text, .product-card__title, h3, h2, a").first().text().trim()
          const $img = $el.find("img").first()
          if (name && name.length > 2) {
            products.push({
              name: cleanName(name),
              description: null,
              price: cleanPrice($el.find(".price, .money, .price-item, [class*='price']").first().contents().first().text()),
              image_url: getImgSrc($img),
              url: $el.find("a").first().attr("href") || null,
              category: null,
            })
          }
        })
      }
    }

    // 4. Final fallback: h2/h3 content sections
    if (products.length === 0) {
      $("h2, h3").each((_, el) => {
        const name = $(el).text().trim()
        if (name && name.length > 3 && name.length < 100) {
          const nextP = $(el).next("p").text().trim()
          const $parent = $(el).parent()
          const $img = $parent.find("img").first()
          products.push({
            name: cleanName(name),
            description: nextP?.slice(0, 300) || null,
            price: null,
            image_url: getImgSrc($img),
            url: null,
            category: null,
          })
        }
      })
    }

    // Deduplicate by normalized name
    const seen = new Set<string>()
    const uniqueProducts = products.filter(p => {
      const key = p.name.toLowerCase().replace(/\s+/g, " ").trim()
      if (!key || key.length < 3 || seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Resolve URLs + final cleanup
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
      return {
        ...p,
        image_url: imgUrl,
        url: prodUrl,
        price: cleanPrice(p.price) || p.price,
      }
    })

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
