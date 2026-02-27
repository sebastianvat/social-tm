import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Globe, Calendar, Sparkles, Send, ArrowRight, Coins, BarChart3 } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { count: brandCount } = await supabase
    .from("brands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: publishedCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published")

  const firstName = profile?.full_name?.split(" ")[0] || "acolo"

  return (
    <div className="max-w-3xl">
      {/* Greeting */}
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Buna, {firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ce vrei sa faci astazi?
        </p>
      </div>

      {/* Quick actions — like ElevenLabs "Get started with" */}
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
              href: "/dashboard/calendar",
              icon: Calendar,
              title: "Genereaza calendar",
              desc: "30 postari cu text si imagini AI",
              tokens: "50 tokeni",
            },
            {
              href: "/dashboard/posting",
              icon: Send,
              title: "Auto-posting",
              desc: "Conecteaza si publica pe social media",
              tokens: "2 tokeni/post",
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
              key={action.href}
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
          Statistici
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Tokeni", value: profile?.tokens ?? 0 },
            { label: "Branduri", value: brandCount ?? 0 },
            { label: "Postari", value: postCount ?? 0 },
            { label: "Publicate", value: publishedCount ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 p-4">
              <p className="text-[11px] font-medium text-zinc-400">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
