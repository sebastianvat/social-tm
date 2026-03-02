import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { url, bucket = "post-images" } = await request.json()
  if (!url) return NextResponse.json({ error: "URL lipsa" }, { status: 400 })

  const bucketBase = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(bucketBase)
  if (idx === -1) return NextResponse.json({ error: "URL invalid" }, { status: 400 })

  const filePath = decodeURIComponent(url.slice(idx + bucketBase.length))

  if (!filePath.startsWith(user.id + "/")) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 })
  }

  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
