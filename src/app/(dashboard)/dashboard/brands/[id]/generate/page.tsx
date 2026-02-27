"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, Coins, Calendar, Check, Trash2, Image as ImageIcon, ChevronDown, ChevronUp, Package, Wand2 } from "lucide-react"
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
  const [postCount, setPostCount] = useState(30)
  const [platforms, setPlatforms] = useState(["facebook", "instagram"])
  const [error, setError] = useState("")

  const [step, setStep] = useState<Step>("config")
  const [posts, setPosts] = useState<GeneratedPost[]>([])
  const [calendarId, setCalendarId] = useState("")
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set())
  const [bulkGenerating, setBulkGenerating] = useState(false)

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
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Eroare la generare")
        setStep("config")
        return
      }

      const postsRes = await fetch(`/api/posts?calendarId=${data.calendarId}`)
      const postsData = await postsRes.json()

      setPosts(postsData.posts?.map((p: any) => ({ ...p, selected: true })) || [])
      setCalendarId(data.calendarId)
      setStep("review")
    } catch {
      setError("Eroare de conexiune")
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
            <p className="mb-3 text-[13px] font-medium text-zinc-900">Numar postari</p>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((n) => (
                <button key={n} onClick={() => setPostCount(n)} className={`flex h-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors ${postCount === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-300"}`}>
                  {n} postari
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
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
        <h2 className="mt-6 text-xl font-semibold text-zinc-900">Se genereaza postarile...</h2>
        <p className="mt-2 text-sm text-zinc-500">Claude Opus creeaza {postCount} idei unice. Dureaza ~30 secunde.</p>
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
                      <div className="mt-3">
                        <img src={post.image_url} alt="" className="h-40 w-40 rounded-lg object-cover" />
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
      </div>
    )
  }

  return null
}
