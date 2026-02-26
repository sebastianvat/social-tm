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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Branduri</h1>
          <p className="mt-1 text-sm text-zinc-500">Website-urile tale scanate</p>
        </div>
        <Link
          href="/dashboard/brands/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-medium text-white hover:from-violet-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Adauga brand
        </Link>
      </div>

      {brands && brands.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/dashboard/brands/${brand.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Globe className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{brand.name}</h3>
                  <p className="text-sm text-zinc-500">{brand.url}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-800">
          <Globe className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">Niciun brand inca</h3>
          <p className="mt-1 text-sm text-zinc-500">Adauga primul tau brand pentru a incepe</p>
          <Link
            href="/dashboard/brands/new"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-medium text-white hover:from-violet-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Scaneaza website
          </Link>
        </div>
      )}
    </div>
  )
}
