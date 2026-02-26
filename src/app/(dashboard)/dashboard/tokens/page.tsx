import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Coins, ArrowUp, ArrowDown, Gift, Zap } from "lucide-react"
import { TOKEN_PACKS, TOKEN_COSTS } from "@/lib/tokens"
import { TokenBadge } from "@/components/token-badge"

export default async function TokensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", user.id)
    .single()

  const { data: transactions } = await supabase
    .from("token_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tokeni</h1>
          <p className="mt-1 text-sm text-zinc-500">Cumpara tokeni si vezi istoricul</p>
        </div>
        <TokenBadge tokens={profile?.tokens ?? 0} size="lg" />
      </div>

      {/* Token Packs */}
      <div className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Cumpara tokeni</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-xl border p-5 ${
                pack.popular
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/30"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
                  Popular
                </div>
              )}
              <h3 className="font-semibold text-zinc-900 dark:text-white">{pack.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{pack.price}</span>
                <span className="text-sm text-zinc-500">EUR</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400">
                <Coins className="h-3.5 w-3.5" />
                {pack.tokens} tokeni
              </div>
              <button className="mt-4 flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                Cumpara
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Table */}
      <div className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Costuri pe actiune</h2>
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {Object.entries(TOKEN_COSTS).map(([key, value], idx) => {
            const labels: Record<string, string> = {
              SCAN_WEBSITE: "Scaneaza website",
              GENERATE_CALENDAR: "Genereaza calendar (30 postari)",
              GENERATE_POST: "Genereaza o postare",
              GENERATE_IMAGE: "Genereaza imagine AI",
              REGENERATE_POST: "Regenereaza postare",
              AUTO_POST: "Auto-postare pe social media",
            }
            return (
              <div
                key={key}
                className={`flex items-center justify-between px-5 py-3 ${
                  idx > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""
                }`}
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {labels[key] || key}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                  <Coins className="h-3.5 w-3.5" />
                  {value} tokeni
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Istoric tranzactii</h2>
        {transactions && transactions.length > 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  idx > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {tx.type === "purchase" ? (
                    <ArrowUp className="h-4 w-4 text-emerald-500" />
                  ) : tx.type === "bonus" ? (
                    <Gift className="h-4 w-4 text-violet-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-zinc-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString("ro-RO")}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-600" : "text-zinc-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-12 dark:border-zinc-800">
            <Zap className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="mt-2 text-sm text-zinc-500">Nicio tranzactie inca</p>
          </div>
        )}
      </div>
    </div>
  )
}
