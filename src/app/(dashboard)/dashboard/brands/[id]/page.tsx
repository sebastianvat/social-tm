import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Globe, Package, Calendar, Sparkles, ArrowLeft, ExternalLink, Coins } from "lucide-react"
import { TOKEN_COSTS } from "@/lib/tokens"
import { DeleteBrandButton } from "./delete-brand-button"

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { id } = await params

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!brand) notFound()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false })

  const { data: calendars } = await supabase
    .from("content_calendars")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", id)

  return (
    <div>
      {/* Back + header */}
      <div className="mb-8">
        <Link
          href="/dashboard/brands"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Inapoi la branduri
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
              <Globe className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">{brand.name}</h1>
              <a
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[13px] text-zinc-400 hover:text-zinc-600"
              >
                {brand.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Produse</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{products?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Calendare</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{calendars?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-[11px] font-medium text-zinc-400">Postari</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{postCount ?? 0}</p>
        </div>
      </div>

      {/* Generate calendar CTA */}
      <div className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-900">Genereaza calendar social media</h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              AI-ul creeaza 30 postari cu text si imagini bazate pe produsele tale
            </p>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400">
              <Coins className="h-3 w-3" />
              Costa {TOKEN_COSTS.GENERATE_CALENDAR} tokeni
            </p>
          </div>
          <Link
            href={`/dashboard/brands/${id}/generate`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Genereaza
          </Link>
        </div>
      </div>

      {/* Products */}
      <div className="mb-10">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Produse gasite ({products?.length ?? 0})
        </p>

        {products && products.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                {product.image_url && (
                  <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-zinc-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-[13px] font-medium text-zinc-900 line-clamp-2">{product.name}</h3>
                {product.price && (
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{product.price}</p>
                )}
                {product.description && (
                  <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{product.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12">
            <Package className="h-8 w-8 text-zinc-200" />
            <p className="mt-2 text-sm text-zinc-500">Niciun produs gasit la scanare</p>
          </div>
        )}
      </div>

      {/* Calendars */}
      {calendars && calendars.length > 0 && (
        <div>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Calendare generate
          </p>
          <div className="space-y-2">
            {calendars.map((cal) => (
              <Link
                key={cal.id}
                href="/dashboard/calendar"
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">{cal.name}</p>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(cal.created_at).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  cal.status === "completed" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                }`}>
                  {cal.status === "completed" ? "Complet" : cal.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
