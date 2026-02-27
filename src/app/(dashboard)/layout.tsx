import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", user.id)
    .single()

  return (
    <div className="flex h-screen bg-white">
      <Sidebar tokens={profile?.tokens ?? 0} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
