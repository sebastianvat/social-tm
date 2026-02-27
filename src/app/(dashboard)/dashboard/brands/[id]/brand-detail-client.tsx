"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Package, Calendar, Sparkles, ExternalLink, Coins, Globe, Plus,
  Search, RefreshCw, Loader2, Trash2, Image as ImageIcon, Link2,
} from "lucide-react"
import { TOKEN_COSTS } from "@/lib/tokens"
import { DeleteBrandButton } from "./delete-brand-button"

interface Product {
  id: string
  name: string
  description: string | null
  price: string | null
  image_url: string | null
  url: string | null
}

interface CalendarItem {
  id: string
  name: string
  status: string
  created_at: string
}

interface BrandData {
  id: string
  name: string
  url: string
  description: string | null
  brand_voice: string | null
  tone: string | null
  target_audience: string | null
  content_pillars: string[] | null
  visual_style: string | null
  posting_rules: string | null
  last_scan_at: string | null
}

function displayPrice(raw: string | null): string | null {
  if (!raw) return null
  const normalized = raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
  const match = normalized.match(/([\d.,]+)\s*(lei|ron|eur|€|\$|usd)/i)
  if (match) return `${match[1]} ${match[2]}`
  if (/^[\d.,]+$/.test(normalized)) return normalized
  return normalized.slice(0, 20)
}

const TABS = [
  { id: "products", label: "Colectie de produse", icon: Package },
  { id: "profile", label: "Informatii brand", icon: Sparkles },
  { id: "calendars", label: "Calendare", icon: Calendar },
] as const

type TabId = typeof TABS[number]["id"]

export function BrandDetailClient({
  brand,
  products: initialProducts,
  calendars,
  postCount,
}: {
  brand: BrandData
  products: Product[]
  calendars: CalendarItem[]
  postCount: number
}) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>("products")
  const [products, setProducts] = useState(initialProducts)
  const [scanning, setScanning] = useState(false)
  const [scanUrl, setScanUrl] = useState("")
  const [scanError, setScanError] = useState("")
  const [scanSuccess, setScanSuccess] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const hasProfile = !!(brand.brand_voice || brand.tone || brand.target_audience)

  async function handleRescan(url: string) {
    if (!url) return
    setScanning(true)
    setScanError("")
    setScanSuccess("")

    let fullUrl = url.trim()
    if (!fullUrl.startsWith("http")) fullUrl = "https://" + fullUrl

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl, brandId: brand.id, mode: "rescan" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setScanError(data.error || "Eroare la scanare")
      } else {
        setScanSuccess(`${data.productsFound} produse gasite!`)
        setScanUrl("")
        // Reload products
        const prodRes = await fetch(`/api/products?brandId=${brand.id}`)
        if (prodRes.ok) {
          const prodData = await prodRes.json()
          setProducts(prodData.products || [])
        }
        router.refresh()
      }
    } catch {
      setScanError("Eroare de conexiune")
    }
    setScanning(false)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
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
              {brand.url.replace(/^https?:\/\//, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/brands/${brand.id}/generate`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-[12px] font-medium text-white hover:bg-zinc-800"
          >
            <Sparkles className="h-3 w-3" />
            Genereaza continut
          </Link>
          <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 p-3">
          <p className="text-[11px] text-zinc-400">Produse</p>
          <p className="text-lg font-semibold text-zinc-900">{products.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <p className="text-[11px] text-zinc-400">Postari</p>
          <p className="text-lg font-semibold text-zinc-900">{postCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <p className="text-[11px] text-zinc-400">Calendare</p>
          <p className="text-lg font-semibold text-zinc-900">{calendars.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <p className="text-[11px] text-zinc-400">Profil AI</p>
          <p className="text-lg font-semibold text-zinc-900">{hasProfile ? "Completat" : "Gol"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium transition-all ${
                isActive
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB: Products */}
      {tab === "products" && (
        <div>
          {/* Rescan section */}
          <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-[13px] font-medium text-zinc-900">Scaneaza produse</p>
                <p className="text-[11px] text-zinc-400">
                  Adauga link-ul magazinului sau al unei colectii / categorii
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRescan(scanUrl)}
                placeholder="https://magazin.ro/colectii/produse-noi"
                className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
              />
              <button
                onClick={() => handleRescan(scanUrl)}
                disabled={scanning || !scanUrl.trim()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {scanning ? "Se scaneaza..." : "Scaneaza"}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400">
              <Coins className="h-3 w-3" /> {TOKEN_COSTS.SCAN_WEBSITE} tokeni per scanare · Produsele existente vor fi inlocuite
            </p>
            {scanError && <p className="mt-2 text-[12px] text-red-500">{scanError}</p>}
            {scanSuccess && <p className="mt-2 text-[12px] text-green-600">{scanSuccess}</p>}
          </div>

          {/* Quick rescan original URL */}
          <button
            onClick={() => handleRescan(brand.url)}
            disabled={scanning}
            className="mb-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${scanning ? "animate-spin" : ""}`} />
            Rescaneaza {brand.url.replace(/^https?:\/\//, "")}
          </button>

          {/* Search */}
          {products.length > 5 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Cauta produse..."
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
              />
            </div>
          )}

          {/* Products grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const price = displayPrice(product.price)
                return (
                  <div key={product.id} className="group rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300">
                    <div className="flex gap-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                          <Package className="h-5 w-5 text-zinc-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-medium text-zinc-900">{product.name}</p>
                        {price && (
                          <p className="mt-0.5 text-[12px] font-semibold text-zinc-700">{price}</p>
                        )}
                        {product.description && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">{product.description}</p>
                        )}
                      </div>
                    </div>
                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <ExternalLink className="h-2.5 w-2.5" /> Vezi pe site
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12">
              <Package className="h-8 w-8 text-zinc-200" />
              <p className="mt-2 text-[13px] text-zinc-500">
                {productSearch ? "Niciun produs gasit" : "Niciun produs. Scaneaza un link mai sus."}
              </p>
            </div>
          )}

          <p className="mt-3 text-[11px] text-zinc-400">
            Ultima scanare: {brand.last_scan_at
              ? new Date(brand.last_scan_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Niciodata"}
          </p>
        </div>
      )}

      {/* TAB: Brand Profile */}
      {tab === "profile" && (
        <div>
          {hasProfile ? (
            <div className="space-y-4">
              {brand.description && (
                <ProfileField label="Descriere" value={brand.description} />
              )}
              {brand.brand_voice && (
                <ProfileField label="Vocea brandului" value={brand.brand_voice} />
              )}
              {brand.tone && (
                <ProfileField label="Ton comunicare" value={brand.tone} />
              )}
              {brand.target_audience && (
                <ProfileField label="Audienta tinta" value={brand.target_audience} />
              )}
              {brand.content_pillars && brand.content_pillars.length > 0 && (
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Piloni de continut</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.content_pillars.map((p, i) => (
                      <span key={i} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-zinc-700">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {brand.visual_style && (
                <ProfileField label="Stil vizual" value={brand.visual_style} />
              )}
              {brand.posting_rules && (
                <ProfileField label="Reguli de continut" value={brand.posting_rules} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12">
              <Sparkles className="h-8 w-8 text-zinc-200" />
              <p className="mt-2 text-[13px] text-zinc-500">Profilul nu e completat inca</p>
              <p className="mt-1 text-[11px] text-zinc-400">Completeaza manual sau lasa AI-ul sa il genereze automat</p>
            </div>
          )}
          <Link
            href={`/dashboard/brands/${brand.id}/profile`}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {hasProfile ? "Editeaza profilul" : "Genereaza cu AI"}
          </Link>
        </div>
      )}

      {/* TAB: Calendars */}
      {tab === "calendars" && (
        <div>
          {/* Generate CTA */}
          <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-medium text-zinc-900">Genereaza calendar nou</h2>
                <p className="mt-1 text-[11px] text-zinc-400">
                  AI-ul creeaza idei de postari bazate pe produsele si profilul tau
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                  <Coins className="h-3 w-3" /> {TOKEN_COSTS.GENERATE_CALENDAR} tokeni
                </p>
              </div>
              <Link
                href={`/dashboard/brands/${brand.id}/generate`}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
              >
                <Sparkles className="h-3.5 w-3.5" /> Genereaza
              </Link>
            </div>
          </div>

          {calendars.length > 0 ? (
            <div className="space-y-2">
              {calendars.map((cal) => (
                <Link
                  key={cal.id}
                  href="/dashboard/calendar"
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-[13px] font-medium text-zinc-900">{cal.name}</p>
                      <p className="text-[11px] text-zinc-400">
                        {new Date(cal.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    cal.status === "completed" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {cal.status === "completed" ? "Complet" : cal.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12">
              <Calendar className="h-8 w-8 text-zinc-200" />
              <p className="mt-2 text-[13px] text-zinc-500">Niciun calendar generat inca</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="whitespace-pre-wrap text-[13px] text-zinc-700">{value}</p>
    </div>
  )
}
