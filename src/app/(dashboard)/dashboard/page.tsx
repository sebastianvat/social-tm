import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { Globe, Calendar, Sparkles, Send, ArrowRight, Coins, FileText } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const cookieStore = await cookies()
  const selectedBrandId = cookieStore.get("selected_brand")?.value || null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { count: brandCount } = await supabase
    .from("brands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  let postQuery = supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
  if (selectedBrandId) postQuery = postQuery.eq("brand_id", selectedBrandId)
  const { count: postCount } = await postQuery

  let publishedQuery = supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published")
  if (selectedBrandId) publishedQuery = publishedQuery.eq("brand_id", selectedBrandId)
  const { count: publishedCount } = await publishedQuery

  let scheduledQuery = supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "scheduled")
  if (selectedBrandId) scheduledQuery = scheduledQuery.eq("brand_id", selectedBrandId)
  const { count: scheduledCount } = await scheduledQuery

  let draftQuery = supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "draft")
  if (selectedBrandId) draftQuery = draftQuery.eq("brand_id", selectedBrandId)
  const { count: draftCount } = await draftQuery

  let brandName: string | null = null
  if (selectedBrandId) {
    const { data: brand } = await supabase.from("brands").select("name").eq("id", selectedBrandId).single()
    brandName = brand?.name || null
  }

  const firstName = profile?.full_name?.split(" ")[0] || "acolo"

  const generateHref = selectedBrandId
    ? `/dashboard/brands/${selectedBrandId}/generate`
    : "/dashboard/brands/new"

  return (
    <div className="max-w-3xl">
      {/* Greeting */}
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Buna, {firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {brandName ? `Lucrezi pe ${brandName}` : "Ce vrei sa faci astazi?"}
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-12">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Start rapid
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/dashboard/brands/new",
              icon: Globe,
              title: "Scaneaza website",
              desc: "Extrage produse si creeaza un brand",
              tokens: "10 tokeni",
            },
            {
              href: generateHref,
              icon: Calendar,
              title: "Genereaza calendar",
              desc: brandName ? `Calendar nou pentru ${brandName}` : "30 postari cu text si imagini AI",
              tokens: "50 tokeni",
            },
            {
              href: "/dashboard/posts",
              icon: FileText,
              title: "Gestioneaza postari",
              desc: brandName ? `Vezi postarile ${brandName}` : "Editeaza si programeaza postari",
              tokens: "",
            },
            {
              href: "/dashboard/tokens",
              icon: Coins,
              title: "Cumpara tokeni",
              desc: "Alege pachetul potrivit",
              tokens: "",
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex items-start gap-3 rounded-xl border border-zinc-200 p-4 transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                <action.icon className="h-4 w-4 text-zinc-500 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900">{action.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                </div>
                <span className="mt-0.5 block text-xs text-zinc-500">{action.desc}</span>
                {action.tokens && (
                  <span className="mt-1.5 inline-block text-[11px] text-zinc-400">{action.tokens}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Statistici{brandName ? ` — ${brandName}` : ""}
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {[
            { label: "Tokeni", value: profile?.tokens ?? 0 },
            { label: "Branduri", value: brandCount ?? 0 },
            { label: "Postari", value: postCount ?? 0 },
            { label: "Programate", value: scheduledCount ?? 0 },
            { label: "Publicate", value: publishedCount ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 p-4">
              <p className="text-[11px] font-medium text-zinc-400">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">{stat.value}</p>
            </div>
          ))}
        </div>
        {draftCount && draftCount > 0 ? (
          <div className="mt-3 rounded-lg bg-amber-50 px-4 py-2.5">
            <p className="text-[13px] text-amber-700">
              Ai <span className="font-semibold">{draftCount} postari draft</span> care asteapta revizuirea.{" "}
              <Link href="/dashboard/posts" className="underline hover:no-underline">
                Vezi postarile
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
