import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings, User, Mail, Key } from "lucide-react"
import { LogoutButton } from "./logout-button"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Setari</h1>
        <p className="mt-1 text-sm text-zinc-500">Gestioneaza contul tau</p>
      </div>

      {/* Profile info */}
      <div className="mb-8">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Profil</p>
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
              <User className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-zinc-900">{profile?.full_name || "Fara nume"}</p>
              <p className="text-[11px] text-zinc-400">Membru din {new Date(profile?.created_at || "").toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[13px] text-zinc-700">{user.email}</span>
            </div>
          </div>
          <div className="border-t border-zinc-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[13px] text-zinc-700">
                Autentificare: {user.app_metadata?.provider === "google" ? "Google" : "Email + parola"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div>
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Actiuni</p>
        <div className="space-y-3">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
