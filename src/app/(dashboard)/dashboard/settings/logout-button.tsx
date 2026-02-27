"use client"

import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      Deconecteaza-te
    </button>
  )
}
