import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Globe, ArrowRight } from "lucide-react"

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Branduri</h1>
          <p className="mt-1 text-sm text-zinc-500">Website-urile tale scanate</p>
        </div>
        <Link
          href="/dashboard/brands/new"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Adauga brand
        </Link>
      </div>

      {brands && brands.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/dashboard/brands/${brand.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-900">
                  <Globe className="h-4 w-4 text-zinc-500 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-zinc-900">{brand.name}</h3>
                  <p className="text-xs text-zinc-500">{brand.url}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-16">
          <Globe className="h-10 w-10 text-zinc-300" />
          <h3 className="mt-4 text-sm font-medium text-zinc-900">Niciun brand inca</h3>
          <p className="mt-1 text-xs text-zinc-500">Adauga primul tau brand pentru a incepe</p>
          <Link
            href="/dashboard/brands/new"
            className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Scaneaza website
          </Link>
        </div>
      )}
    </div>
  )
}
