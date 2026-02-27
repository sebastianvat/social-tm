import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Send, Globe, Plus, ArrowRight, Clock, Check, AlertCircle } from "lucide-react"

export default async function PostingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: socialAccounts } = await supabase
    .from("social_accounts")
    .select("*, brands(name)")
    .eq("user_id", user.id)

  const { data: scheduledPosts } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true })
    .limit(10)

  const { data: recentPublished } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .eq("user_id", user.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Auto-posting</h1>
        <p className="mt-1 text-sm text-zinc-500">Conecteaza conturile si publica automat</p>
      </div>

      {/* Connected accounts */}
      <div className="mb-10">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Conturi conectate
        </p>

        {socialAccounts && socialAccounts.length > 0 ? (
          <div className="space-y-2">
            {socialAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                    <Globe className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">{account.account_name}</p>
                    <p className="text-[11px] text-zinc-400">{account.platform} · {(account.brands as any)?.name}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  account.status === "active" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                }`}>
                  {account.status === "active" ? "Activ" : "Inactiv"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12">
            <Send className="h-8 w-8 text-zinc-200" />
            <h3 className="mt-4 text-sm font-medium text-zinc-900">Niciun cont conectat</h3>
            <p className="mt-1 text-xs text-zinc-500">Conecteaza Facebook sau Instagram pentru auto-posting</p>
            <p className="mt-4 text-[11px] text-zinc-400">
              Mergi la un brand si conecteaza contul de social media
            </p>
          </div>
        )}
      </div>

      {/* Scheduled posts */}
      <div className="mb-10">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Postari programate ({scheduledPosts?.length ?? 0})
        </p>

        {scheduledPosts && scheduledPosts.length > 0 ? (
          <div className="space-y-2">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900 line-clamp-1">
                      {post.content?.substring(0, 60)}...
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {post.platform} · {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString("ro-RO") : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-white">
                  Programat
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center">
            <p className="text-sm text-zinc-500">Nicio postare programata</p>
            <p className="mt-1 text-[11px] text-zinc-400">Genereaza un calendar pentru a programa postari</p>
          </div>
        )}
      </div>

      {/* Recent published */}
      {recentPublished && recentPublished.length > 0 && (
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Publicate recent
          </p>
          <div className="space-y-2">
            {recentPublished.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-zinc-900" />
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900 line-clamp-1">
                      {post.content?.substring(0, 60)}...
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {post.platform} · {post.published_at ? new Date(post.published_at).toLocaleDateString("ro-RO") : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white">
                  Publicat
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
