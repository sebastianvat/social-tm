import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 })

  const { id: productId } = await params

  const { data: files, error } = await supabase.storage
    .from("post-images")
    .list(`${user.id}/product-studio`, {
      search: productId,
      sortBy: { column: "created_at", order: "desc" },
    })

  if (error) {
    return NextResponse.json({ photos: [] })
  }

  const photos = (files || [])
    .filter((f) => f.name.startsWith(productId))
    .map((f) => {
      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(`${user.id}/product-studio/${f.name}`)

      const stylePart = f.name.replace(`${productId}-`, "").split("-")[0]

      return {
        url: data.publicUrl,
        style: stylePart,
        createdAt: f.created_at,
        name: f.name,
      }
    })

  return NextResponse.json({ photos })
}
