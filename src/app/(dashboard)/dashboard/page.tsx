import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Globe, Calendar, Coins, ArrowRight, Zap, Plus, TrendingUp } from "lucide-react"

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Buna, {profile?.full_name || "acolo"}!
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Uite ce se intampla cu conturile tale.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tokeni", value: profile?.tokens ?? 0, icon: Coins, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950" },
          { label: "Branduri", value: brandCount ?? 0, icon: Globe, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Postari", value: postCount ?? 0, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: "Publicate", value: publishedCount ?? 0, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-500">{stat.label}</span>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Start rapid</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/brands/new"
            className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800 dark:hover:bg-violet-950"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Adauga brand nou</h3>
              <p className="text-sm text-zinc-500">Scaneaza website-ul si extrage produsele</p>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/dashboard/tokens"
            className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800 dark:hover:bg-violet-950"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Cumpara tokeni</h3>
              <p className="text-sm text-zinc-500">Alege pachetul potrivit pentru tine</p>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
