import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const brandId = request.nextUrl.searchParams.get("brandId")
  if (!brandId) return NextResponse.json({ error: "brandId obligatoriu" }, { status: 400 })

  const { data: brand } = await supabase.from("brands").select("id").eq("id", brandId).eq("user_id", user.id).single()
  if (!brand) return NextResponse.json({ error: "Brand negasit" }, { status: 404 })

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .order("name")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ products })
}
