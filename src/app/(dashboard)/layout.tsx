import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { BrandProvider } from "@/components/brand-provider"
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
    <BrandProvider brands={brands || []} initialBrandId={validBrandId}>
      <div className="flex h-screen bg-white">
        <Sidebar tokens={tokens} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 flex-shrink-0 items-center justify-end border-b border-zinc-100 px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[13px] text-zinc-500">
                <Coins className="h-3.5 w-3.5 text-zinc-400" />
                <span>{formatTokens(tokens)} credits remaining</span>
              </div>
              <div className="rounded-full bg-zinc-900 px-3 py-1 text-[12px] font-medium text-white">
                You have {formatTokens(tokens)} credits left.
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-8 py-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BrandProvider>
  )
}
