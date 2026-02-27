import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BrandDetailClient } from "./brand-detail-client"

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params

  const [{ data: brand }, { data: products }, { data: calendars }, { count: postCount }] = await Promise.all([
    supabase.from("brands").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("products").select("*").eq("brand_id", id).order("name"),
    supabase.from("content_calendars").select("id, name, status, created_at").eq("brand_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("brand_id", id),
  ])

  if (!brand) notFound()

  return (
    <div>
      <Link
        href="/dashboard/brands"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Inapoi la branduri
      </Link>

      <BrandDetailClient
        brand={brand}
        products={products || []}
        calendars={calendars || []}
        postCount={postCount ?? 0}
      />
    </div>
  )
}
