"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Camera, Wand2, Loader2, Package, Check,
  FileText, Download, ExternalLink, X, Sparkles, RefreshCw, Trash2, Undo2,
  Copy, Pencil, Layers, Star,
} from "lucide-react"
import { TOKEN_COSTS } from "@/lib/tokens"
import { useActivity } from "@/components/activity-provider"

type Product = {
  id: string
  name: string
  description: string | null
  price: string | null
  image_url: string | null
  url: string | null
  category: string | null
}

type GeneratedDesc = {
  short: string
  medium: string
  seo: string
}

const STYLES = [
  { id: "room", label: "In Camera", desc: "Produs montat in camera reala" },
  { id: "closeup", label: "Detaliu", desc: "Close-up pe textura si material" },
  { id: "styled", label: "Scena Stilizata", desc: "Cu accesorii decorative" },
  { id: "white", label: "Fundal Alb", desc: "Studio, e-commerce curat" },
]

export default function ProductStudioPage() {
  const params = useParams()
  const brandId = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const activity = useActivity()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Product | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [style, setStyle] = useState("room")

  const [generatingPhoto, setGeneratingPhoto] = useState(false)
  const [generatedPhotos, setGeneratedPhotos] = useState<{ url: string; style: string }[]>([])

  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [generatedDescs, setGeneratedDescs] = useState<GeneratedDesc | null>(null)
  const [savedDesc, setSavedDesc] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const [rescraping, setRescraping] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function rescrapeOriginal() {
    if (!selected?.url) return
    setRescraping(true)
    setError("")
    try {
      const res = await fetch("/api/scrape/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selected.url }),
      })
      const data = await res.json()
      if (res.ok && data.images?.length > 0) {
        const newImg = data.images[0]
        setOriginalImageUrl(newImg)
        setSelected((prev) => prev ? { ...prev, image_url: newImg } : prev)
        await fetch(`/api/products/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: newImg }),
        })
      } else {
        setError("Nu s-a gasit poza pe site")
      }
    } catch {
      setError("Eroare la scanarea site-ului")
    }
    setRescraping(false)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/products?brandId=${brandId}`)
      if (res.ok) {
        const data = await res.json()
        const list = data.products || []
        setProducts(list)

        const pid = searchParams.get("product")
        if (pid && list.length > 0) {
          const found = list.find((p: Product) => p.id === pid)
          if (found) selectProduct(found, false)
        }
      }
      setLoading(false)
    }
    load()
  }, [brandId])

  async function selectProduct(p: Product, updateUrl = true) {
    setSelected(p)
    setOriginalImageUrl(p.image_url)
    setGeneratedPhotos([])
    setGeneratedDescs(null)
    setSavedDesc(null)
    setError("")

    if (updateUrl) {
      router.replace(`?product=${p.id}`, { scroll: false })
    }

    try {
      const res = await fetch(`/api/products/${p.id}/studio-photos`)
      if (res.ok) {
        const data = await res.json()
        if (data.photos?.length > 0) {
          setGeneratedPhotos(data.photos.map((ph: any) => ({ url: ph.url, style: ph.style })))
        }
      }
    } catch {}
  }

  async function generatePhoto() {
    if (!selected) return
    setGeneratingPhoto(true)
    setError("")
    const actId = `studio-photo-${selected.id}-${Date.now()}`
    activity.addActivity({ id: actId, type: "image", label: `Studio: ${selected.name.slice(0, 30)}`, href: `/dashboard/brands/${brandId}/product-studio` })

    try {
      const res = await fetch("/api/generate/product-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.id,
          productName: selected.name,
          productDescription: selected.description,
          productCategory: selected.category,
          productImageUrl: originalImageUrl,
          style,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Eroare generare")
        activity.updateActivity(actId, "error")
      } else {
        setGeneratedPhotos((prev) => [{ url: data.imageUrl, style: data.style || style }, ...prev])
        activity.updateActivity(actId, "done")
      }
    } catch (e: any) {
      setError(e?.message || "Eroare conexiune")
      activity.updateActivity(actId, "error")
    }
    setGeneratingPhoto(false)
  }

  async function discardPhoto(photoUrl: string) {
    setGeneratedPhotos((prev) => prev.filter((p) => p.url !== photoUrl))
    try {
      await fetch("/api/storage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoUrl, bucket: "post-images" }),
      })
    } catch {}
  }

  async function setAsMain(photoUrl: string) {
    if (!selected) return
    await fetch(`/api/products/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: photoUrl }),
    }).catch(() => {})
    setSelected((prev) => prev ? { ...prev, image_url: photoUrl } : prev)
  }

  const [generatingAll, setGeneratingAll] = useState(false)
  const [allProgress, setAllProgress] = useState({ done: 0, total: 0 })

  async function generateAllStyles() {
    if (!selected) return
    const stylesToGen = ["room", "closeup", "styled", "white"]
    setGeneratingAll(true)
    setAllProgress({ done: 0, total: stylesToGen.length })
    setError("")

    for (const s of stylesToGen) {
      const actId = `studio-all-${selected.id}-${s}-${Date.now()}`
      activity.addActivity({ id: actId, type: "image", label: `${selected.name.slice(0, 20)}: ${s}`, href: `/dashboard/brands/${brandId}/product-studio` })

      try {
        const res = await fetch("/api/generate/product-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: selected.id,
            productName: selected.name,
            productDescription: selected.description,
            productCategory: selected.category,
            productImageUrl: originalImageUrl,
            style: s,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setGeneratedPhotos((prev) => [...prev, { url: data.imageUrl, style: s }])
          activity.updateActivity(actId, "done")
        } else {
          activity.updateActivity(actId, "error")
        }
      } catch {
        activity.updateActivity(actId, "error")
      }
      setAllProgress((prev) => ({ ...prev, done: prev.done + 1 }))
    }
    setGeneratingAll(false)
  }

  async function downloadPhoto(url: string, styleName: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${selected?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "product"}-${styleName}-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch {}
  }

  async function revertToOriginal() {
    if (!selected || !originalImageUrl) return
    setSelected((prev) => prev ? { ...prev, image_url: originalImageUrl } : prev)
    await fetch(`/api/products/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: originalImageUrl }),
    }).catch(() => {})
  }

  async function generateDescription() {
    if (!selected) return
    setGeneratingDesc(true)
    setError("")

    try {
      const res = await fetch("/api/generate/product-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.id,
          productName: selected.name,
          originalDescription: selected.description,
          category: selected.category,
          price: selected.price,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Eroare optimizare")
      } else {
        setGeneratedDescs(data.descriptions)
        if (data.descriptions?.medium) {
          setSavedDesc("medium")
          setSelected((prev) => prev ? { ...prev, description: data.descriptions.medium } : prev)
        }
      }
    } catch (e: any) {
      setError(e?.message || "Eroare conexiune")
    }
    setGeneratingDesc(false)
  }

  async function saveDescription(variant: "short" | "medium" | "seo") {
    if (!selected || !generatedDescs) return
    const text = generatedDescs[variant]
    await fetch(`/api/products/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: text }),
    }).catch(() => {})
    setSavedDesc(variant)
    setSelected((prev) => prev ? { ...prev, description: text } : prev)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div>
      <Link
        href={`/dashboard/brands/${brandId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Inapoi la brand
      </Link>

      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900">
          <Camera className="h-6 w-6" /> Product Studio
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Regenereaza fotografii de produs si optimizeaza descrierile cu AI
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Product list */}
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-[13px] font-medium text-zinc-900">
              Selecteaza produs ({products.length})
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProduct(p)}
                className={`flex w-full items-center gap-3 border-b border-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                  selected?.id === p.id ? "bg-zinc-50 ring-1 ring-inset ring-zinc-200" : ""
                }`}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <Package className="h-5 w-5 text-zinc-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-zinc-900">{p.name}</p>
                  {p.price && (
                    <p className="text-[12px] text-zinc-500">{p.price}</p>
                  )}
                </div>
                {selected?.id === p.id && (
                  <Check className="h-4 w-4 flex-shrink-0 text-zinc-900" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Studio workspace */}
        <div>
          {!selected ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-32 text-center">
              <Camera className="mb-3 h-8 w-8 text-zinc-300" />
              <p className="text-[14px] font-medium text-zinc-500">
                Selecteaza un produs din stanga
              </p>
              <p className="mt-1 text-[13px] text-zinc-400">
                Vei putea regenera fotografiile si optimiza descrierea
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product header + original photo */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start gap-5">
                  {/* Original photo - always visible */}
                  <div className="flex-shrink-0">
                    {originalImageUrl ? (
                      <div className="relative">
                        <img
                          src={originalImageUrl}
                          alt=""
                          className="h-44 w-44 cursor-pointer rounded-xl object-cover ring-1 ring-zinc-200 transition-transform hover:scale-[1.02]"
                          onClick={() => setLightbox(originalImageUrl)}
                        />
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                          Originala
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-zinc-100">
                        <Package className="h-10 w-10 text-zinc-300" />
                      </div>
                    )}
                    {selected.url && (
                      <button
                        onClick={rescrapeOriginal}
                        disabled={rescraping}
                        className="mt-2 inline-flex w-44 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
                      >
                        {rescraping ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        {rescraping ? "Se scaneaza..." : "Rescaneaza de pe site"}
                      </button>
                    )}
                  </div>
                  {/* Product info */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-zinc-900">{selected.name}</h2>
                    {selected.category && (
                      <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">
                        {selected.category}
                      </span>
                    )}
                    {selected.price && (
                      <p className="mt-1 text-[15px] font-bold text-zinc-900">{selected.price}</p>
                    )}
                    {selected.url && (
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[12px] text-zinc-400 hover:text-zinc-700"
                      >
                        <ExternalLink className="h-3 w-3" /> Vezi pe site
                      </a>
                    )}
                    {selected.description && (
                      <p className="mt-3 text-[13px] leading-relaxed text-zinc-500 line-clamp-4">
                        {selected.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo generation */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-zinc-900">
                  <Camera className="h-4 w-4" /> Regenereaza Fotografie
                </h3>

                <p className="mb-3 text-[12px] text-zinc-500">Alege stilul fotografiei:</p>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`rounded-lg border px-3 py-2.5 text-center transition-colors ${
                        style === s.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      <p className="text-[12px] font-medium">{s.label}</p>
                      <p className={`text-[10px] ${style === s.id ? "text-zinc-300" : "text-zinc-400"}`}>
                        {s.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={generatePhoto}
                    disabled={generatingPhoto || generatingAll}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {generatingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {generatingPhoto ? "Se genereaza..." : `Genereaza 1 fotografie (${TOKEN_COSTS.GENERATE_IMAGE} tok)`}
                  </button>
                  <button
                    onClick={generateAllStyles}
                    disabled={generatingPhoto || generatingAll}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-zinc-900 bg-white px-5 text-[13px] font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {generatingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {allProgress.done}/{allProgress.total}
                      </>
                    ) : (
                      <>
                        <Layers className="h-4 w-4" />
                        Genereaza toate 4 stilurile ({TOKEN_COSTS.GENERATE_IMAGE * 4} tok)
                      </>
                    )}
                  </button>
                </div>

                {generatedPhotos.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[12px] font-medium text-zinc-500">
                        Fotografii generate ({generatedPhotos.length}):
                      </p>
                      {originalImageUrl && generatedPhotos.length > 0 && (
                        <button
                          onClick={revertToOriginal}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        >
                          <Undo2 className="h-3 w-3" />
                          Revino la originala
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {generatedPhotos.map((photo, i) => {
                        const isMain = selected?.image_url === photo.url
                        return (
                          <div key={i} className="group relative">
                            <img
                              src={photo.url}
                              alt=""
                              className={`h-52 w-full cursor-pointer rounded-xl object-cover transition-transform hover:scale-[1.01] ${
                                isMain ? "ring-2 ring-emerald-500" : "ring-1 ring-zinc-200"
                              }`}
                              onClick={() => setLightbox(photo.url)}
                            />
                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                              <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                                {STYLES.find((s) => s.id === photo.style)?.label || photo.style}
                              </span>
                              {isMain && (
                                <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                                  Principala
                                </span>
                              )}
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              {!isMain && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAsMain(photo.url) }}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow hover:bg-emerald-600"
                                  title="Seteaza ca poza principala"
                                >
                                  <Star className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.url, photo.style) }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white"
                                title="Descarca"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); discardPhoto(photo.url) }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-600"
                                title="Sterge"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Description optimization */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-zinc-900">
                  <FileText className="h-4 w-4" /> Optimizeaza Descrierea
                </h3>

                <button
                  onClick={generateDescription}
                  disabled={generatingDesc}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {generatingDesc ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generatingDesc ? "Se optimizeaza..." : "Optimizeaza cu AI (2 tokeni)"}
                </button>

                {generatedDescs && (
                  <div className="mt-4 space-y-3">
                    {(["short", "medium", "seo"] as const).map((variant) => {
                      const labels = {
                        short: "Scurta (Social Media)",
                        medium: "Medie (Website)",
                        seo: "SEO (Keywords)",
                      }
                      const text = generatedDescs[variant]
                      if (!text) return null

                      return (
                        <div
                          key={variant}
                          className={`rounded-lg border p-4 ${
                            savedDesc === variant
                              ? "border-green-200 bg-green-50"
                              : "border-zinc-200 bg-zinc-50"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[12px] font-medium text-zinc-500">
                              {labels[variant]}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedDescs[variant] || "")
                                  setCopied(variant)
                                  setTimeout(() => setCopied(null), 2000)
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                                title="Copiaza in clipboard"
                              >
                                {copied === variant ? (
                                  <><Check className="h-3 w-3 text-green-600" /> Copiat!</>
                                ) : (
                                  <><Copy className="h-3 w-3" /> Copiaza</>
                                )}
                              </button>
                              <button
                                onClick={() => saveDescription(variant)}
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  savedDesc === variant
                                    ? "bg-green-100 text-green-700"
                                    : "bg-white text-zinc-600 hover:bg-zinc-100"
                                }`}
                              >
                                {savedDesc === variant ? (
                                  <><Check className="h-3 w-3" /> Salvat</>
                                ) : (
                                  <><Download className="h-3 w-3" /> Salveaza pe produs</>
                                )}
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={generatedDescs[variant] || ""}
                            onChange={(e) =>
                              setGeneratedDescs((prev) =>
                                prev ? { ...prev, [variant]: e.target.value } : prev
                              )
                            }
                            rows={variant === "seo" ? 5 : variant === "medium" ? 4 : 3}
                            className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
