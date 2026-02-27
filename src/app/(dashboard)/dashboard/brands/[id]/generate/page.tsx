"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, Coins, Calendar, Check, Trash2, Image as ImageIcon, ChevronDown, ChevronUp, Package, Wand2, X, ExternalLink } from "lucide-react"
import { TOKEN_COSTS } from "@/lib/tokens"
import { ProductSelector } from "@/components/product-card"

const MONTHS = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"]
const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
]

const TYPE_LABELS: Record<string, string> = {
  promo: "Promo",
  educational: "Educational",
  engagement: "Engagement",
  brand_story: "Brand Story",
}

type Product = {
  id: string
  name: string
  description: string | null
  price: string | null
  image_url: string | null
  url: string | null
}

type GeneratedPost = {
  id: string
  content: string
  hashtags: string[]
  post_type: string
  platform: string
  image_prompt: string | null
  image_url?: string | null
  scheduled_at: string
  selected: boolean
}

type Step = "config" | "generating" | "review"

export default function GenerateCalendarPage() {
  const params = useParams()
  const brandId = params.id as string

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2)
  const [year, setYear] = useState(now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear())
  const [postCount, setPostCount] = useState(20)
  const [platforms, setPlatforms] = useState(["facebook", "instagram"])
  const [error, setError] = useState("")

  const [step, setStep] = useState<Step>("config")
  const [posts, setPosts] = useState<GeneratedPost[]>([])
  const [calendarId, setCalendarId] = useState("")
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set())
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (step !== "generating") { setElapsed(0); return }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [step])

  useEffect(() => {
    if (step !== "generating") return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [step])

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true)
      const res = await fetch(`/api/products?brandId=${brandId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setSelectedProducts(new Set((data.products || []).map((p: Product) => p.id)))
      }
      setLoadingProducts(false)
    }
    loadProducts()
  }, [brandId])

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    if (platforms.length === 0) {
      setError("Selecteaza cel putin o platforma")
      return
    }
    setStep("generating")
    setError("")

    try {
      const res = await fetch("/api/generate/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          month,
          year,
          postCount,
          platforms,
          selectedProductIds: Array.from(selectedProducts),
        }),
      })

      let data
      try {
        data = await res.json()
      } catch {
        setError(`Server error (${res.status}). Posibil timeout — incearca cu mai putine postari.`)
        setStep("config")
        return
      }

      if (!res.ok) {
        setError(data.error || `Eroare server (${res.status})`)
        setStep("config")
        return
      }

      const postsRes = await fetch(`/api/posts?calendarId=${data.calendarId}`)
      const postsData = await postsRes.json()

      setPosts(postsData.posts?.map((p: any) => ({ ...p, selected: true })) || [])
      setCalendarId(data.calendarId)
      setStep("review")
    } catch (err: any) {
      setError(`Eroare conexiune: ${err?.message || "Network error"}. Verifica conexiunea si incearca din nou.`)
      setStep("config")
    }
  }

  async function handleDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    await fetch(`/api/posts/${postId}`, { method: "DELETE" }).catch(() => {})
  }

  async function handleGenerateImage(postId: string) {
    const post = posts.find((p) => p.id === postId)
    if (!post?.image_prompt) return

    setGeneratingImages((prev) => new Set(prev).add(postId))

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, prompt: post.image_prompt }),
      })
      const data = await res.json()
      if (res.ok && data.imageUrl) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, image_url: data.imageUrl } : p))
        )
      }
    } catch {}

    setGeneratingImages((prev) => {
      const next = new Set(prev)
      next.delete(postId)
      return next
    })
  }

  async function handleBulkGenerateImages() {
    const postsWithPrompts = posts.filter((p) => p.image_prompt && !p.image_url)
    if (postsWithPrompts.length === 0) return

    setBulkGenerating(true)
    for (const post of postsWithPrompts) {
      await handleGenerateImage(post.id)
    }
    setBulkGenerating(false)
  }

  const postsWithImages = posts.filter((p) => p.image_url)
  const postsWithoutImages = posts.filter((p) => p.image_prompt && !p.image_url)

  // STEP: Config
  if (step === "config") {
    return (
      <div className="max-w-lg">
        <Link href={`/dashboard/brands/${brandId}`} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Inapoi la brand
        </Link>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Genereaza calendar</h1>
          <p className="mt-1 text-sm text-zinc-500">Configureaza si selecteaza produsele de inclus</p>
        </div>
        <div className="space-y-6">
          {/* Month + Year */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="mb-3 text-[13px] font-medium text-zinc-900">Luna si anul</p>
            <div className="grid grid-cols-2 gap-3">
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Platforms */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="mb-3 text-[13px] font-medium text-zinc-900">Platforme</p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => togglePlatform(p.id)} className={`flex h-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors ${platforms.includes(p.id) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-300"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Post count */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="mb-3 text-[13px] font-medium text-zinc-900">Numar idei de postari</p>
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 30].map((n) => (
                <button key={n} onClick={() => setPostCount(n)} className={`flex h-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors ${postCount === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-300"}`}>
                  {n} idei
                </button>
              ))}
            </div>
          </div>

          {/* Product selector */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-400" />
                <p className="text-[13px] font-medium text-zinc-900">Produse de inclus</p>
              </div>
              {products.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedProducts.size === products.length) {
                      setSelectedProducts(new Set())
                    } else {
                      setSelectedProducts(new Set(products.map((p) => p.id)))
                    }
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900"
                >
                  {selectedProducts.size === products.length ? "Deselecteaza tot" : "Selecteaza tot"}
                </button>
              )}
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            ) : products.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-zinc-400">
                Niciun produs gasit. Scaneaza website-ul brandului mai intai.
              </p>
            ) : (
              <>
                <ProductSelector
                  products={products}
                  selected={selectedProducts}
                  onToggle={toggleProduct}
                />
                <p className="mt-3 text-[11px] text-zinc-400">
                  {selectedProducts.size} din {products.length} produse selectate — AI-ul va crea postari focusate pe acestea
                </p>
              </>
            )}
          </div>

          {/* Cost */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-500">Cost generare text</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900">
                <Coins className="h-3.5 w-3.5 text-zinc-400" /> {TOKEN_COSTS.GENERATE_CALENDAR} tokeni
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">Imaginile se genereaza separat dupa (5 tokeni/poza)</p>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button onClick={handleGenerate} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800">
            <Sparkles className="h-4 w-4" /> Genereaza {postCount} idei de postari
          </button>
        </div>
      </div>
    )
  }

  // STEP: Generating
  if (step === "generating") {
    const statusMessages = [
      "Analizez profilul brandului...",
      "Selectez produsele potrivite...",
      "Creez mix-ul de continut...",
      "Generez texte pentru postari...",
      "Optimizez hashtag-uri...",
      "Creez prompt-uri pentru imagini...",
      "Finalizez calendarul...",
    ]
    const msgIndex = Math.min(Math.floor(elapsed / 8), statusMessages.length - 1)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60

    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-zinc-200" />
          <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-zinc-900" />
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-zinc-900">
            {mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`}
          </span>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-zinc-900">Se genereaza postarile...</h2>
        <p className="mt-2 text-sm text-zinc-500 transition-opacity duration-500">{statusMessages[msgIndex]}</p>
        <div className="mt-6 w-64">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((elapsed / 50) * 100, 95)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Claude Opus creeaza {postCount} idei unice · ~30-60 sec
          </p>
        </div>
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-[12px] text-amber-700">
            Nu inchide pagina — generarea se va opri daca parasesti.
          </p>
        </div>
      </div>
    )
  }

  // STEP: Review
  if (step === "review") {
    return (
      <div>
        <Link href={`/dashboard/brands/${brandId}`} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Inapoi la brand
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {posts.length} postari generate
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {MONTHS[month - 1]} {year} · Revieweaza, editeaza sau sterge inainte de a genera imagini
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <button
            onClick={handleBulkGenerateImages}
            disabled={bulkGenerating || postsWithoutImages.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {bulkGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Genereaza toate imaginile ({postsWithoutImages.length})
          </button>
          <span className="text-[11px] text-zinc-400">
            {postsWithoutImages.length} x {TOKEN_COSTS.GENERATE_IMAGE} = {postsWithoutImages.length * TOKEN_COSTS.GENERATE_IMAGE} tokeni
          </span>
          <div className="ml-auto flex items-center gap-4 text-[11px] text-zinc-400">
            <span>{postsWithImages.length} cu imagine</span>
            <span>{postsWithoutImages.length} fara imagine</span>
          </div>
        </div>

        <Link
          href={`/dashboard/posts`}
          className="mb-6 inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Calendar className="h-3.5 w-3.5" /> Gestioneaza in Postari
        </Link>

        {/* Posts list */}
        <div className="space-y-3">
          {posts.map((post) => {
            const isExpanded = expandedPost === post.id
            const isGeneratingImg = generatingImages.has(post.id)
            const hasImage = !!post.image_url

            return (
              <div key={post.id} className="rounded-xl border border-zinc-200 bg-white">
                <div
                  className="flex cursor-pointer items-center gap-3 p-4"
                  onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        post.post_type === "promo" ? "bg-zinc-900 text-white" :
                        post.post_type === "educational" ? "bg-zinc-600 text-white" :
                        post.post_type === "engagement" ? "bg-zinc-400 text-white" :
                        "bg-zinc-200 text-zinc-700"
                      }`}>
                        {TYPE_LABELS[post.post_type] || post.post_type}
                      </span>
                      <span className="text-[11px] text-zinc-400">{post.platform}</span>
                      <span className="text-[11px] text-zinc-400">·</span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(post.scheduled_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                      </span>
                      {hasImage && <ImageIcon className="h-3 w-3 text-green-500" />}
                    </div>
                    <p className="mt-1 text-[13px] text-zinc-900 line-clamp-1">{post.content}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-100 p-4">
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{post.content}</p>

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.hashtags.map((tag, i) => (
                          <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.image_url && (
                      <div
                        className="mt-3 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(post.image_url!) }}
                      >
                        <img src={post.image_url} alt="" className="h-40 w-40 rounded-lg object-cover ring-1 ring-zinc-200 transition-transform hover:scale-105" />
                        <p className="mt-1 text-[10px] text-zinc-400">Click pentru marit</p>
                      </div>
                    )}

                    {post.image_prompt && (
                      <div className="mt-3 rounded-lg bg-zinc-50 p-3">
                        <p className="text-[11px] font-medium text-zinc-400">Prompt imagine AI:</p>
                        <p className="mt-1 text-[12px] text-zinc-500">{post.image_prompt}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {!hasImage && post.image_prompt && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateImage(post.id) }}
                          disabled={isGeneratingImg}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {isGeneratingImg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                          Genereaza imagine ({TOKEN_COSTS.GENERATE_IMAGE} tokeni)
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" /> Sterge
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Image lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Imagine generata"
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-[13px] font-medium text-zinc-900 shadow-lg hover:bg-zinc-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Deschide original (1024x1024)
              </a>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
