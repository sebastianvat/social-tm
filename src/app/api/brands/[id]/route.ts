import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { id } = await params

  // Delete in order: posts → calendars → products → scan_history → brand
  await supabase.from("posts").delete().eq("brand_id", id).eq("user_id", user.id)
  await supabase.from("content_calendars").delete().eq("brand_id", id).eq("user_id", user.id)
  await supabase.from("products").delete().eq("brand_id", id)
  await supabase.from("scan_history").delete().eq("brand_id", id).eq("user_id", user.id)
  await supabase.from("social_accounts").delete().eq("brand_id", id).eq("user_id", user.id)

  const { error } = await supabase.from("brands").delete().eq("id", id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
