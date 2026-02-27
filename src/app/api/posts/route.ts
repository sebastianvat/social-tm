import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const calendarId = request.nextUrl.searchParams.get("calendarId")
  const brandId = request.nextUrl.searchParams.get("brandId")

  let query = supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true })

  if (calendarId) query = query.eq("calendar_id", calendarId)
  if (brandId) query = query.eq("brand_id", brandId)

  const { data: posts, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ posts })
}
