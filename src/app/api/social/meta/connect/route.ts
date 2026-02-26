import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const META_APP_ID = process.env.META_APP_ID || ""
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/meta/callback`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 })
  }

  const { brandId } = await request.json()

  const scopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
  ].join(",")

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&state=${brandId}`

  return NextResponse.json({ authUrl })
}
