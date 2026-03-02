"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Camera, Wand2, Loader2, Package, Check,
  FileText, Download, ExternalLink, X, Sparkles, RefreshCw, Trash2, Undo2,
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
  { id: "editorial", label: "Editorial", desc: "In context real, lumina naturala" },
  { id: "lifestyle", label: "Lifestyle", desc: "In interior, atmosfera calda" },
  { id: "flatlay", label: "Flat Lay", desc: "Vedere de sus, aranjat" },
  { id: "white", label: "Fundal Alb", desc: "Studio, e-commerce" },
  { id: "artistic", label: "Artistic", desc: "Dramatic, cinematografic" },
]

export default function ProductStudioPage() {
  const params = useParams()
  const brandId = params.id as string
  const activity = useActivity()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Product | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [style, setStyle] = useState("editorial")

  const [generatingPhoto, setGeneratingPhoto] = useState(false)
  const [generatedPhotos, setGeneratedPhotos] = useState<{ url: string; style: string }[]>([])

  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [generatedDescs, setGeneratedDescs] = useState<GeneratedDesc | null>(null)
  const [savedDesc, setSavedDesc] = useState<string | null>(null)

  const [lightbox, setLightbox] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/products?brandId=${brandId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
      setLoading(false)
    }
    load()
  }, [brandId])

  function selectProduct(p: Product) {
    setSelected(p)
    setOriginalImageUrl(p.image_url)
    setGeneratedPhotos([])
    setGeneratedDescs(null)
    setSavedDesc(null)
    setError("")
  }

  async function generatePhoto() {
    if (!selected) return
    setGeneratingPhoto(true)
    setError("")
    const actId = `studio-photo-${selected.id}-${Date.now()}`
    activity.addActivity({ id: actId, type: "image", label: `Studio: ${selected.name.slice(0, 30)}` })

    try {
      const res = await fetch("/api/generate/product-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.id,
          productName: selected.name,
          productDescription: selected.description,
          productCategory: selected.category,
          style,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Eroare generare")
        activity.updateActivity(actId, "error")
      } else {
        setGeneratedPhotos((prev) => [{ url: data.imageUrl, style: data.style || style }, ...prev])
        setSelected((prev) => prev ? { ...prev, image_url: data.imageUrl } : prev)
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
    if (selected?.image_url === photoUrl) {
      const remaining = generatedPhotos.filter((p) => p.url !== photoUrl)
      const newUrl = remaining.length > 0 ? remaining[0].url : originalImageUrl
      setSelected((prev) => prev ? { ...prev, image_url: newUrl } : prev)
      if (selected) {
        await fetch(`/api/products/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: newUrl }),
        }).catch(() => {})
      }
    }
  }

  async function revertToOriginal() {
    if (!selected || !originalImageUrl) return
    setSelected((prev) => prev ? { ...prev, image_url: originalImageUrl } : prev)
    setGeneratedPhotos([])
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
              {/* Product header */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  {selected.image_url ? (
                    <img
                      src={selected.image_url}
                      alt=""
                      className="h-24 w-24 cursor-pointer rounded-xl object-cover ring-1 ring-zinc-200 transition-transform hover:scale-105"
                      onClick={() => setLightbox(selected.image_url)}
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-100">
                      <Package className="h-8 w-8 text-zinc-300" />
                    </div>
                  )}
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
                  </div>
                </div>
                {selected.description && (
                  <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
                    {selected.description}
                  </p>
                )}
              </div>

              {/* Photo generation */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-zinc-900">
                  <Camera className="h-4 w-4" /> Regenereaza Fotografie
                </h3>

                <p className="mb-3 text-[12px] text-zinc-500">Alege stilul fotografiei:</p>
                <div className="mb-4 grid grid-cols-5 gap-2">
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

                <button
                  onClick={generatePhoto}
                  disabled={generatingPhoto}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-5 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {generatingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {generatingPhoto ? "Se genereaza..." : `Genereaza fotografie (${TOKEN_COSTS.GENERATE_IMAGE} tokeni)`}
                </button>

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
                    <div className="grid grid-cols-3 gap-3">
                      {generatedPhotos.map((photo, i) => (
                        <div key={i} className="group relative">
                          <img
                            src={photo.url}
                            alt=""
                            className="h-40 w-full cursor-pointer rounded-xl object-cover ring-1 ring-zinc-200 transition-transform hover:scale-[1.02]"
                            onClick={() => setLightbox(photo.url)}
                          />
                          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                            {STYLES.find((s) => s.id === photo.style)?.label || photo.style}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); discardPhoto(photo.url) }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                            title="Sterge aceasta varianta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
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
                            <button
                              onClick={() => saveDescription(variant)}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                savedDesc === variant
                                  ? "bg-green-100 text-green-700"
                                  : "bg-white text-zinc-600 hover:bg-zinc-100"
                              }`}
                            >
                              {savedDesc === variant ? (
                                <>
                                  <Check className="h-3 w-3" /> Salvat
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3" /> Salveaza pe produs
                                </>
                              )}
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
                            {text}
                          </p>
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
