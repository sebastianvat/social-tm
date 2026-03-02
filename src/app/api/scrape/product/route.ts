import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SCRAPER_URL = process.env.SCRAPER_API_URL || "https://molty.transilvaniabusinesssuite.ro/scraper"
const SCRAPER_KEY = process.env.SCRAPER_API_KEY || "tbs-scraper-2026-secret"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: "URL lipsa" }, { status: 400 })

  try {
    const resp = await fetch(`${SCRAPER_URL}/scrape-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SCRAPER_KEY,
      },
      body: JSON.stringify({ url, wait_seconds: 5 }),
      signal: AbortSignal.timeout(60000),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: "Scraper unavailable" }))
      return NextResponse.json({ error: err.detail || `Scraper error: ${resp.status}` }, { status: 500 })
    }

    const data = await resp.json()

    return NextResponse.json({
      name: data.name || "",
      description: data.description || "",
      price: data.price || null,
      images: data.images || [],
      category: data.category || null,
      url,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Eroare la scraping" }, { status: 500 })
  }
}
