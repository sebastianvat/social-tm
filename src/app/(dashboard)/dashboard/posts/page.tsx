"use client"

import { useEffect, useState, useCallback } from "react"
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  X,
  Check,
  Image as ImageIcon,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  Calendar,
  Hash,
  Eye,
  Wand2,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react"
import { useBrand } from "@/components/brand-provider"
import { ProductCardMini } from "@/components/product-card"

interface ProductInfo {
  id: string
  name: string
  description: string | null
  price: string | null
  image_url: string | null
  url: string | null
}

interface Post {
  id: string
  calendar_id: string
  brand_id: string
  user_id: string
  content: string
  hashtags: string[]
  image_url: string | null
  image_prompt: string | null
  post_type: "promo" | "educational" | "engagement" | "brand_story"
  platform: "facebook" | "instagram" | "linkedin" | "tiktok"
  scheduled_at: string | null
  published_at: string | null
  status: "draft" | "approved" | "scheduled" | "published" | "failed"
  product_id: string | null
  products: ProductInfo | null
  tokens_used: number
  created_at: string
  brands: { name: string; url: string } | null
}

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-3.5 w-3.5" />,
  instagram: <Instagram className="h-3.5 w-3.5" />,
  linkedin: <Linkedin className="h-3.5 w-3.5" />,
  tiktok: <span className="text-[11px] font-bold">TT</span>,
}

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  approved: "Aprobat",
  scheduled: "Programat",
  published: "Publicat",
  failed: "Esuat",
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  approved: "bg-blue-50 text-blue-700",
  scheduled: "bg-amber-50 text-amber-700",
  published: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
}

const typeLabels: Record<string, string> = {
  promo: "Promo",
  educational: "Educational",
  engagement: "Engagement",
  brand_story: "Brand Story",
}

export default function PostsPage() {
  const { selectedBrandId, selectedBrand } = useBrand()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Post>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("")

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Bulk operations
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkStatusChange, setBulkStatusChange] = useState(false)
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterPlatform) params.set("platform", filterPlatform)
    if (selectedBrandId) params.set("brandId", selectedBrandId)

    const res = await fetch(`/api/posts?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts || [])
    }
    setSelected(new Set())
    setLoading(false)
  }, [filterStatus, filterPlatform, selectedBrandId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filteredPosts = searchQuery
    ? posts.filter(
        (p) =>
          p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.hashtags?.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.brands?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts

  // Selection helpers
  const allSelected = filteredPosts.length > 0 && filteredPosts.every((p) => selected.has(p.id))
  const someSelected = filteredPosts.some((p) => selected.has(p.id))

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredPosts.map((p) => p.id)))
    }
  }

  // Get selected posts
  const selectedPosts = filteredPosts.filter((p) => selected.has(p.id))
  const selectedWithoutImage = selectedPosts.filter((p) => p.image_prompt && !p.image_url)

  function startEdit(post: Post) {
    setEditingId(post.id)
    setEditForm({
      content: post.content,
      hashtags: post.hashtags,
      platform: post.platform,
      status: post.status,
      post_type: post.post_type,
      scheduled_at: post.scheduled_at,
    })
    setExpandedId(post.id)
  }

  async function saveEdit(postId: string) {
    setSaving(true)
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const data = await res.json()
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...data.post } : p)))
      setEditingId(null)
    }
    setSaving(false)
  }

  async function deletePost(postId: string) {
    setDeleting(postId)
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (expandedId === postId) setExpandedId(null)
      selected.delete(postId)
      setSelected(new Set(selected))
    }
    setDeleting(null)
  }

  async function generateImage(post: Post) {
    if (!post.image_prompt) return
    setGeneratingImageFor(post.id)
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, prompt: post.image_prompt }),
      })
      if (res.ok) {
        const data = await res.json()
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, image_url: data.imageUrl } : p))
        )
      }
    } catch {}
    setGeneratingImageFor(null)
  }

  async function bulkGenerateImages() {
    if (selectedWithoutImage.length === 0) return
    setBulkGenerating(true)
    setBulkProgress({ done: 0, total: selectedWithoutImage.length })

    for (const post of selectedWithoutImage) {
      try {
        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post.id, prompt: post.image_prompt }),
        })
        if (res.ok) {
          const data = await res.json()
          setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, image_url: data.imageUrl } : p))
          )
        }
      } catch {}
      setBulkProgress((prev) => ({ ...prev, done: prev.done + 1 }))
    }

    setBulkGenerating(false)
    setSelected(new Set())
  }

  async function bulkDelete() {
    if (!confirm(`Stergi ${selectedPosts.length} postari selectate?`)) return
    setBulkDeleting(true)
    for (const post of selectedPosts) {
      await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
    }
    setPosts((prev) => prev.filter((p) => !selected.has(p.id)))
    setSelected(new Set())
    setBulkDeleting(false)
  }

  async function bulkChangeStatus(newStatus: string) {
    setBulkStatusChange(true)
    for (const post of selectedPosts) {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, ...data.post } : p))
        )
      }
    }
    setBulkStatusChange(false)
    setSelected(new Set())
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Neprogramat"
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const statCounts = {
    total: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    noImage: posts.filter((p) => p.image_prompt && !p.image_url).length,
  }

  const isBulkBusy = bulkGenerating || bulkDeleting || bulkStatusChange

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Postari{selectedBrand ? ` — ${selectedBrand.name}` : ""}
        </h1>
        <p className="mt-1 text-[14px] text-zinc-500">
          Selecteaza, editeaza si genereaza imagini pentru postari
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: statCounts.total, color: "bg-zinc-900 text-white" },
          { label: "Draft", value: statCounts.draft, color: "bg-zinc-100 text-zinc-700" },
          { label: "Programate", value: statCounts.scheduled, color: "bg-amber-50 text-amber-700" },
          { label: "Publicate", value: statCounts.published, color: "bg-green-50 text-green-700" },
          { label: "Fara imagine", value: statCounts.noImage, color: "bg-orange-50 text-orange-700" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3"
          >
            <span className="text-[12px] text-zinc-500">{stat.label}</span>
            <span
              className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-2 text-[12px] font-semibold ${stat.color}`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Cauta in postari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">Toate statusurile</option>
            <option value="draft">Draft</option>
            <option value="approved">Aprobat</option>
            <option value="scheduled">Programat</option>
            <option value="published">Publicat</option>
            <option value="failed">Esuat</option>
          </select>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">Toate platformele</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {someSelected && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <span className="text-[13px] font-medium text-zinc-700">
            {selected.size} selectate
          </span>
          <div className="h-4 w-px bg-zinc-200" />

          {selectedWithoutImage.length > 0 && (
            <button
              onClick={bulkGenerateImages}
              disabled={isBulkBusy}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {bulkGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {bulkProgress.done}/{bulkProgress.total}
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  Genereaza imagini ({selectedWithoutImage.length})
                </>
              )}
            </button>
          )}

          <select
            onChange={(e) => {
              if (e.target.value) bulkChangeStatus(e.target.value)
              e.target.value = ""
            }}
            disabled={isBulkBusy}
            className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-700 disabled:opacity-50"
            defaultValue=""
          >
            <option value="" disabled>Schimba status</option>
            <option value="draft">→ Draft</option>
            <option value="approved">→ Aprobat</option>
            <option value="scheduled">→ Programat</option>
          </select>

          <button
            onClick={bulkDelete}
            disabled={isBulkBusy}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 text-[11px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {bulkDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Sterge selectia
          </button>

          <div className="flex-1" />
          <button
            onClick={() => setSelected(new Set())}
            className="text-[11px] text-zinc-500 hover:text-zinc-900"
          >
            Deselecteaza tot
          </button>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-zinc-100 px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-[14px] font-medium text-zinc-500">
            {posts.length === 0 ? "Nicio postare inca" : "Niciun rezultat gasit"}
          </p>
          <p className="mt-1 text-[13px] text-zinc-400">
            {posts.length === 0
              ? "Genereaza un calendar pentru a crea postari"
              : "Incearca sa schimbi filtrele"}
          </p>
        </div>
      ) : (
        <div>
          {/* Select all header */}
          <div className="mb-2 flex items-center gap-3 px-4 py-1">
            <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-zinc-900">
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-zinc-900" />
              ) : someSelected ? (
                <MinusSquare className="h-4 w-4 text-zinc-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-[11px] text-zinc-400">
              {allSelected ? "Deselecteaza tot" : "Selecteaza tot"}
            </span>
          </div>

          <div className="space-y-2">
            {filteredPosts.map((post) => {
              const isExpanded = expandedId === post.id
              const isEditing = editingId === post.id
              const isSelected = selected.has(post.id)
              const isGeneratingThis = generatingImageFor === post.id
              const canGenerateImage = post.image_prompt && !post.image_url

              return (
                <div
                  key={post.id}
                  className={`rounded-xl border bg-white transition-shadow hover:shadow-sm ${
                    isSelected ? "border-zinc-400 ring-1 ring-zinc-200" : "border-zinc-100"
                  }`}
                >
                  {/* Collapsed row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelect(post.id)
                      }}
                      className="flex-shrink-0 text-zinc-400 hover:text-zinc-900"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-zinc-900" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>

                    {/* Platform icon */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                      {platformIcons[post.platform]}
                    </div>

                    {/* Content preview — clickable to expand */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        if (isEditing) return
                        setExpandedId(isExpanded ? null : post.id)
                      }}
                    >
                      <p className="truncate text-[13px] font-medium text-zinc-900">
                        {post.content.slice(0, 100)}
                        {post.content.length > 100 ? "..." : ""}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {post.brands && (
                          <span className="text-[11px] text-zinc-400">{post.brands.name}</span>
                        )}
                        <span className="text-[11px] text-zinc-300">·</span>
                        <span className="text-[11px] text-zinc-400">{typeLabels[post.post_type]}</span>
                        <span className="text-[11px] text-zinc-300">·</span>
                        <span className="text-[11px] text-zinc-400">{formatDate(post.scheduled_at)}</span>
                      </div>
                    </div>

                    {/* Product mini thumbnail */}
                    {post.products?.image_url && (
                      <img src={post.products.image_url} alt="" className="h-6 w-6 flex-shrink-0 rounded object-cover" />
                    )}

                    {/* Image status indicator */}
                    {post.image_url ? (
                      <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                    ) : post.image_prompt ? (
                      <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
                    ) : null}

                    {/* Status badge */}
                    <span
                      className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${statusColors[post.status]}`}
                    >
                      {statusLabels[post.status]}
                    </span>

                    {/* Expand toggle */}
                    <button
                      onClick={() => {
                        if (isEditing) return
                        setExpandedId(isExpanded ? null : post.id)
                      }}
                      className="flex-shrink-0 text-zinc-400 hover:text-zinc-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-zinc-50 px-4 pb-4 pt-3">
                      {isEditing ? (
                        /* Edit form */
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Continut
                            </label>
                            <textarea
                              value={editForm.content || ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                              rows={5}
                              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Hashtag-uri (separate cu virgula)
                            </label>
                            <input
                              type="text"
                              value={(editForm.hashtags || []).join(", ")}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  hashtags: e.target.value.split(",").map((h) => h.trim()).filter(Boolean),
                                }))
                              }
                              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">Platforma</label>
                              <select value={editForm.platform || ""} onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value as Post["platform"] }))} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none">
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="tiktok">TikTok</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">Status</label>
                              <select value={editForm.status || ""} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Post["status"] }))} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none">
                                <option value="draft">Draft</option>
                                <option value="approved">Aprobat</option>
                                <option value="scheduled">Programat</option>
                                <option value="published">Publicat</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">Tip</label>
                              <select value={editForm.post_type || ""} onChange={(e) => setEditForm((f) => ({ ...f, post_type: e.target.value as Post["post_type"] }))} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none">
                                <option value="promo">Promo</option>
                                <option value="educational">Educational</option>
                                <option value="engagement">Engagement</option>
                                <option value="brand_story">Brand Story</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">Data programata</label>
                            <input
                              type="datetime-local"
                              value={editForm.scheduled_at ? new Date(editForm.scheduled_at).toISOString().slice(0, 16) : ""}
                              onChange={(e) => setEditForm((f) => ({ ...f, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => saveEdit(post.id)} disabled={saving} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Salveaza
                            </button>
                            <button onClick={() => setEditingId(null)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-4 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50">
                              <X className="h-3 w-3" />
                              Anuleaza
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View mode */
                        <div>
                          <div className="flex gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
                                {post.content}
                              </p>

                              {post.hashtags && post.hashtags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {post.hashtags.map((tag, i) => (
                                    <span key={i} className="inline-flex items-center gap-0.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                                      <Hash className="h-2.5 w-2.5" />
                                      {tag.replace(/^#/, "")}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                                <span className="flex items-center gap-1">
                                  {platformIcons[post.platform]}
                                  {platformLabels[post.platform]}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(post.scheduled_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Creat {formatDate(post.created_at)}
                                </span>
                              </div>
                            </div>

                            {post.image_url && (
                              <div className="flex-shrink-0">
                                <img src={post.image_url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                              </div>
                            )}
                          </div>

                          {post.image_prompt && (
                            <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Prompt imagine</p>
                              <p className="mt-0.5 text-[12px] text-zinc-600">{post.image_prompt}</p>
                            </div>
                          )}

                          {/* Linked product */}
                          {post.products && (
                            <div className="mt-3">
                              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">Produs asociat</p>
                              <ProductCardMini product={post.products} />
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-50 pt-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(post) }}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800"
                            >
                              <Pencil className="h-3 w-3" />
                              Editeaza
                            </button>

                            {/* Generate image button */}
                            {canGenerateImage && (
                              <button
                                onClick={(e) => { e.stopPropagation(); generateImage(post) }}
                                disabled={isGeneratingThis}
                                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-orange-500 px-3 text-[11px] font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                              >
                                {isGeneratingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Wand2 className="h-3 w-3" />
                                )}
                                Genereaza imagine
                              </button>
                            )}

                            {/* Regenerate image button */}
                            {post.image_url && post.image_prompt && (
                              <button
                                onClick={(e) => { e.stopPropagation(); generateImage(post) }}
                                disabled={isGeneratingThis}
                                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                              >
                                {isGeneratingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Wand2 className="h-3 w-3" />
                                )}
                                Regenereaza
                              </button>
                            )}

                            {post.status !== "published" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); if (confirm("Stergi aceasta postare?")) deletePost(post.id) }}
                                disabled={deleting === post.id}
                                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[11px] font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                {deleting === post.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Sterge
                              </button>
                            )}

                            {post.image_url && (
                              <a
                                href={post.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[11px] font-medium text-zinc-500 hover:bg-zinc-50"
                              >
                                <Eye className="h-3 w-3" />
                                Vezi imaginea
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
