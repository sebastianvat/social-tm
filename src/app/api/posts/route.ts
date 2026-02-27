import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const calendarId = request.nextUrl.searchParams.get("calendarId")
  const brandId = request.nextUrl.searchParams.get("brandId")
  const status = request.nextUrl.searchParams.get("status")
  const platform = request.nextUrl.searchParams.get("platform")

  let query = supabase
    .from("posts")
    .select("*, brands:brand_id(name, url), products:product_id(id, name, description, price, image_url, url)")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: false, nullsFirst: false })

  if (calendarId) query = query.eq("calendar_id", calendarId)
  if (brandId) query = query.eq("brand_id", brandId)
  if (status) query = query.eq("status", status)
  if (platform) query = query.eq("platform", platform)

  const { data: posts, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts })
}
