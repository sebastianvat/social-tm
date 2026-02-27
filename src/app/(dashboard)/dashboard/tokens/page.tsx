import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Coins, ArrowUp, ArrowDown, Gift, Zap } from "lucide-react"
import { TOKEN_PACKS, TOKEN_COSTS } from "@/lib/tokens"

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
          <h1 className="text-2xl font-semibold text-zinc-900">Tokeni</h1>
          <p className="mt-1 text-sm text-zinc-500">Cumpara tokeni si vezi istoricul</p>
        </div>
        <div className="rounded-full bg-zinc-900 px-3 py-1 text-[13px] font-medium text-white">
          {profile?.tokens ?? 0} credite
        </div>
      </div>

      {/* Token Packs */}
      <div className="mb-12">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Cumpara tokeni</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-xl border p-5 ${
                pack.popular
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-0.5 text-[11px] font-medium text-white">
                  Popular
                </div>
              )}
              <h3 className="text-sm font-medium text-zinc-900">{pack.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-zinc-900">{pack.price}</span>
                <span className="text-xs text-zinc-500">EUR</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <Coins className="h-3 w-3" />
                {pack.tokens} tokeni
              </div>
              <button className="mt-4 flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 text-[13px] font-medium text-white hover:bg-zinc-800">
                Cumpara
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Table */}
      <div className="mb-12">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Costuri pe actiune</p>
        <div className="rounded-xl border border-zinc-200 bg-white">
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
                  idx > 0 ? "border-t border-zinc-100" : ""
                }`}
              >
                <span className="text-[13px] text-zinc-700">
                  {labels[key] || key}
                </span>
                <span className="flex items-center gap-1 text-[13px] font-medium text-zinc-900">
                  <Coins className="h-3 w-3 text-zinc-400" />
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Istoric tranzactii</p>
        {transactions && transactions.length > 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white">
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  idx > 0 ? "border-t border-zinc-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {tx.type === "purchase" ? (
                    <ArrowUp className="h-4 w-4 text-zinc-900" />
                  ) : tx.type === "bonus" ? (
                    <Gift className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-zinc-400" />
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">{tx.description}</p>
                    <p className="text-[11px] text-zinc-400">{new Date(tx.created_at).toLocaleDateString("ro-RO")}</p>
                  </div>
                </div>
                <span className={`text-[13px] font-medium ${tx.amount > 0 ? "text-zinc-900" : "text-zinc-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12">
            <Zap className="h-8 w-8 text-zinc-200" />
            <p className="mt-2 text-sm text-zinc-500">Nicio tranzactie inca</p>
          </div>
        )}
      </div>
    </div>
  )
}
