import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarChart3, TrendingUp, Calendar, Send, Coins } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: publishedPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "published")

  const { count: scheduledPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "scheduled")

  const { count: draftPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "draft")

  const { count: brandCount } = await supabase
    .from("brands")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { count: calendarCount } = await supabase
    .from("content_calendars")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", user.id)
    .single()

  const { data: tokenHistory } = await supabase
    .from("token_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const totalSpent = tokenHistory
    ?.filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) ?? 0

  const stats = [
    { label: "Total postari", value: totalPosts ?? 0, icon: BarChart3 },
    { label: "Publicate", value: publishedPosts ?? 0, icon: Send },
    { label: "Programate", value: scheduledPosts ?? 0, icon: Calendar },
    { label: "Draft", value: draftPosts ?? 0, icon: TrendingUp },
    { label: "Branduri", value: brandCount ?? 0, icon: BarChart3 },
    { label: "Calendare", value: calendarCount ?? 0, icon: Calendar },
    { label: "Tokeni ramasi", value: profile?.tokens ?? 0, icon: Coins },
    { label: "Tokeni folositi", value: totalSpent, icon: Coins },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Statistici despre contul si continutul tau</p>
      </div>

      <div className="mb-10">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Overview
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <stat.icon className="h-3.5 w-3.5 text-zinc-400" />
                <p className="text-[11px] font-medium text-zinc-400">{stat.label}</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {tokenHistory && tokenHistory.length > 0 && (
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Activitate recenta
          </p>
          <div className="rounded-xl border border-zinc-200 bg-white">
            {tokenHistory.map((tx, idx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  idx > 0 ? "border-t border-zinc-100" : ""
                }`}
              >
                <div>
                  <p className="text-[13px] font-medium text-zinc-900">{tx.description}</p>
                  <p className="text-[11px] text-zinc-400">
                    {new Date(tx.created_at).toLocaleDateString("ro-RO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className={`text-[13px] font-medium ${tx.amount > 0 ? "text-zinc-900" : "text-zinc-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
