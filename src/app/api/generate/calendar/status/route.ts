import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const calendarId = request.nextUrl.searchParams.get("calendarId")
  if (!calendarId) return NextResponse.json({ error: "calendarId required" }, { status: 400 })

  const { data: calendar } = await supabase
    .from("content_calendars")
    .select("id, status, post_count")
    .eq("id", calendarId)
    .eq("user_id", user.id)
    .single()

  if (!calendar) return NextResponse.json({ error: "Calendar negasit" }, { status: 404 })

  return NextResponse.json(calendar)
}
