import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { id: jobId } = await params

  const jobUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/jobs/${jobId}.json`

  try {
    const res = await fetch(jobUrl, { cache: "no-store" })

    if (!res.ok) {
      return NextResponse.json({ status: "processing" })
    }

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("json")) {
      return NextResponse.json({ status: "processing" })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ status: "processing" })
  }
}
