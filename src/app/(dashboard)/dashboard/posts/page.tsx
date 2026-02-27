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
} from "lucide-react"

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
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Post>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Filters
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("")
  const [filterBrand, setFilterBrand] = useState("")

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterPlatform) params.set("platform", filterPlatform)
    if (filterBrand) params.set("brandId", filterBrand)

    const res = await fetch(`/api/posts?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts || [])
    }
    setLoading(false)
  }, [filterStatus, filterPlatform, filterBrand])

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

  const brands = Array.from(
    new Map(
      posts
        .filter((p) => p.brands)
        .map((p) => [p.brand_id, { id: p.brand_id, name: p.brands!.name }])
    ).values()
  )

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
    }
    setDeleting(null)
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
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Postari</h1>
        <p className="mt-1 text-[14px] text-zinc-500">
          Gestioneaza, editeaza si programeaza toate postarile tale
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: statCounts.total, color: "bg-zinc-900 text-white" },
          { label: "Draft", value: statCounts.draft, color: "bg-zinc-100 text-zinc-700" },
          { label: "Programate", value: statCounts.scheduled, color: "bg-amber-50 text-amber-700" },
          { label: "Publicate", value: statCounts.published, color: "bg-green-50 text-green-700" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3"
          >
            <span className="text-[13px] text-zinc-500">{stat.label}</span>
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
          {brands.length > 1 && (
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
            >
              <option value="">Toate brandurile</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

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
        <div className="space-y-2">
          {filteredPosts.map((post) => {
            const isExpanded = expandedId === post.id
            const isEditing = editingId === post.id

            return (
              <div
                key={post.id}
                className="rounded-xl border border-zinc-100 bg-white transition-shadow hover:shadow-sm"
              >
                {/* Collapsed row */}
                <div
                  className="flex cursor-pointer items-center gap-3 px-4 py-3"
                  onClick={() => {
                    if (isEditing) return
                    setExpandedId(isExpanded ? null : post.id)
                  }}
                >
                  {/* Platform icon */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                    {platformIcons[post.platform]}
                  </div>

                  {/* Content preview */}
                  <div className="min-w-0 flex-1">
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

                  {/* Status badge */}
                  <span
                    className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${statusColors[post.status]}`}
                  >
                    {statusLabels[post.status]}
                  </span>

                  {/* Image indicator */}
                  {post.image_url && (
                    <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
                  )}

                  {/* Expand toggle */}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-zinc-50 px-4 pb-4 pt-3">
                    {isEditing ? (
                      /* Edit form */
                      <div className="space-y-4">
                        {/* Content */}
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                            Continut
                          </label>
                          <textarea
                            value={editForm.content || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, content: e.target.value }))
                            }
                            rows={5}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        {/* Hashtags */}
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
                                hashtags: e.target.value
                                  .split(",")
                                  .map((h) => h.trim())
                                  .filter(Boolean),
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                          />
                        </div>

                        {/* Row: Platform, Status, Type */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Platforma
                            </label>
                            <select
                              value={editForm.platform || ""}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, platform: e.target.value as Post["platform"] }))
                              }
                              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
                            >
                              <option value="facebook">Facebook</option>
                              <option value="instagram">Instagram</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="tiktok">TikTok</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Status
                            </label>
                            <select
                              value={editForm.status || ""}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, status: e.target.value as Post["status"] }))
                              }
                              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
                            >
                              <option value="draft">Draft</option>
                              <option value="approved">Aprobat</option>
                              <option value="scheduled">Programat</option>
                              <option value="published">Publicat</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Tip
                            </label>
                            <select
                              value={editForm.post_type || ""}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, post_type: e.target.value as Post["post_type"] }))
                              }
                              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
                            >
                              <option value="promo">Promo</option>
                              <option value="educational">Educational</option>
                              <option value="engagement">Engagement</option>
                              <option value="brand_story">Brand Story</option>
                            </select>
                          </div>
                        </div>

                        {/* Scheduled at */}
                        <div>
                          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                            Data programata
                          </label>
                          <input
                            type="datetime-local"
                            value={
                              editForm.scheduled_at
                                ? new Date(editForm.scheduled_at).toISOString().slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                scheduled_at: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              }))
                            }
                            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 focus:border-zinc-400 focus:outline-none"
                          />
                        </div>

                        {/* Save / Cancel */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(post.id)}
                            disabled={saving}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Salveaza
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-4 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50"
                          >
                            <X className="h-3 w-3" />
                            Anuleaza
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div>
                        <div className="flex gap-4">
                          {/* Content + details */}
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
                              {post.content}
                            </p>

                            {/* Hashtags */}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {post.hashtags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                                  >
                                    <Hash className="h-2.5 w-2.5" />
                                    {tag.replace(/^#/, "")}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Meta info */}
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
                              {post.image_prompt && (
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {post.image_url ? "Imagine generata" : "Imagine negenerata"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Image thumbnail */}
                          {post.image_url && (
                            <div className="flex-shrink-0">
                              <img
                                src={post.image_url}
                                alt=""
                                className="h-24 w-24 rounded-lg object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {/* Image prompt */}
                        {post.image_prompt && (
                          <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                              Prompt imagine
                            </p>
                            <p className="mt-0.5 text-[12px] text-zinc-600">{post.image_prompt}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-2 border-t border-zinc-50 pt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEdit(post)
                            }}
                            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800"
                          >
                            <Pencil className="h-3 w-3" />
                            Editeaza
                          </button>
                          {post.status !== "published" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Stergi aceasta postare?`)) deletePost(post.id)
                              }}
                              disabled={deleting === post.id}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-[11px] font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              {deleting === post.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
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
      )}
    </div>
  )
}
