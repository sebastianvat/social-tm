import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { BrandProvider } from "@/components/brand-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/header-controls"
import { Coins } from "lucide-react"
import { formatTokens } from "@/lib/utils"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: brands }] = await Promise.all([
    supabase.from("profiles").select("tokens").eq("id", user.id).single(),
    supabase.from("brands").select("id, name, url").eq("user_id", user.id).order("created_at"),
  ])

  const tokens = profile?.tokens ?? 0

  const cookieStore = await cookies()
  const savedBrand = cookieStore.get("selected_brand")?.value || null
  const validBrandId = brands?.some((b) => b.id === savedBrand) ? savedBrand : (brands?.[0]?.id || null)

  return (
    <ThemeProvider>
      <BrandProvider brands={brands || []} initialBrandId={validBrandId}>
        <div className="flex h-screen bg-white">
          <Sidebar tokens={tokens} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-12 flex-shrink-0 items-center justify-end gap-3 border-b border-zinc-100 px-6">
              <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-medium text-zinc-700">
                <Coins className="h-3 w-3 text-zinc-400" />
                {formatTokens(tokens)} tokeni
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl px-8 py-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </BrandProvider>
    </ThemeProvider>
  )
}
