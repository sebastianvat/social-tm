"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Save, Loader2, Wand2, Globe, Users, Palette,
  MessageSquare, BookOpen, Shield, Eye, Sparkles, Check, X, Plus, Trash2,
} from "lucide-react"

interface BrandProfile {
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
  competitor_notes: string | null
  colors: Record<string, string> | null
}

export default function BrandProfilePage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.id as string

  const [brand, setBrand] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPillar, setNewPillar] = useState("")

  // Editable fields
  const [form, setForm] = useState({
    description: "",
    brand_voice: "",
    tone: "",
    target_audience: "",
    content_pillars: [] as string[],
    visual_style: "",
    posting_rules: "",
    competitor_notes: "",
  })

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/brands/${brandId}`)
      if (res.ok) {
        const data = await res.json()
        setBrand(data.brand)
        setForm({
          description: data.brand.description || "",
          brand_voice: data.brand.brand_voice || "",
          tone: data.brand.tone || "",
          target_audience: data.brand.target_audience || "",
          content_pillars: data.brand.content_pillars || [],
          visual_style: data.brand.visual_style || "",
          posting_rules: data.brand.posting_rules || "",
          competitor_notes: data.brand.competitor_notes || "",
        })
      }
      setLoading(false)
    }
    load()
  }, [brandId])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/brands/${brandId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    const res = await fetch(`/api/brands/${brandId}/analyze`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      const p = data.profile
      setForm({
        description: p.description || form.description,
        brand_voice: p.brand_voice || form.brand_voice,
        tone: p.tone || form.tone,
        target_audience: p.target_audience || form.target_audience,
        content_pillars: p.content_pillars || form.content_pillars,
        visual_style: p.visual_style || form.visual_style,
        posting_rules: p.posting_rules || form.posting_rules,
        competitor_notes: p.competitor_notes || form.competitor_notes,
      })
    }
    setAnalyzing(false)
  }

  function addPillar() {
    if (newPillar.trim()) {
      setForm((f) => ({ ...f, content_pillars: [...f.content_pillars, newPillar.trim()] }))
      setNewPillar("")
    }
  }

  function removePillar(index: number) {
    setForm((f) => ({ ...f, content_pillars: f.content_pillars.filter((_, i) => i !== index) }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!brand) {
    return <p className="py-12 text-center text-zinc-500">Brand negasit</p>
  }

  const isEmpty = !form.brand_voice && !form.tone && !form.target_audience

  return (
    <div className="max-w-2xl">
      <Link
        href={`/dashboard/brands/${brandId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Inapoi la brand
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Profil brand</h1>
          <p className="mt-1 text-[14px] text-zinc-500">
            {brand.name} — ghid AI pentru generarea de continut
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {isEmpty ? "Genereaza cu AI" : "Regenereaza cu AI"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Salvat!" : "Salveaza"}
          </button>
        </div>
      </div>

      {isEmpty && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-amber-500" />
          <p className="text-[14px] font-medium text-amber-800">Profilul nu e completat inca</p>
          <p className="mt-1 text-[13px] text-amber-600">
            Apasa "Genereaza cu AI" si Claude va analiza brandul si produsele tale
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Description */}
        <Section icon={Globe} title="Descriere brand" hint="Cum descrii brandul in 2-3 propozitii">
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Descrie brandul tau..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>

        {/* Brand voice */}
        <Section icon={MessageSquare} title="Vocea brandului" hint="Cum vorbeste brandul — personalitatea din spatele cuvintelor">
          <textarea
            value={form.brand_voice}
            onChange={(e) => setForm((f) => ({ ...f, brand_voice: e.target.value }))}
            rows={2}
            placeholder="Ex: Prietenos si accesibil, cu o nota de expertiza..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>

        {/* Tone */}
        <Section icon={BookOpen} title="Ton comunicare" hint="Cum se simte mesajul — caldura, energie, profesionalism">
          <input
            value={form.tone}
            onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
            placeholder="Ex: Cald, entuziast, informativ"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>

        {/* Target audience */}
        <Section icon={Users} title="Audienta tinta" hint="Cine sunt clientii ideali — varsta, interese, nevoi">
          <textarea
            value={form.target_audience}
            onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))}
            rows={3}
            placeholder="Ex: Femei 25-45 ani, interesate de produse eco..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>

        {/* Content pillars */}
        <Section icon={BookOpen} title="Piloni de continut" hint="Temele principale pe care se axeaza continutul">
          <div className="flex flex-wrap gap-2">
            {form.content_pillars.map((pillar, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12px] font-medium text-zinc-700"
              >
                {pillar}
                <button onClick={() => removePillar(i)} className="text-zinc-400 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPillar())}
              placeholder="Adauga pilon nou..."
              className="h-8 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <button
              onClick={addPillar}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 px-3 text-[12px] text-zinc-500 hover:bg-zinc-50"
            >
              <Plus className="h-3 w-3" /> Adauga
            </button>
          </div>
        </Section>

        {/* Visual style */}
        <Section icon={Palette} title="Stil vizual" hint="Cum arata imaginile — culori, compozitie, atmosfera">
          <textarea
            value={form.visual_style}
            onChange={(e) => setForm((f) => ({ ...f, visual_style: e.target.value }))}
            rows={2}
            placeholder="Ex: Imagini luminoase, fundal alb, produse in prim-plan..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>

        {/* Posting rules */}
        <Section icon={Shield} title="Reguli de continut" hint="Ce sa faca si ce sa NU faca brandul pe social media">
          <textarea
            value={form.posting_rules}
            onChange={(e) => setForm((f) => ({ ...f, posting_rules: e.target.value }))}
            rows={4}
            placeholder="Ex: ✅ Foloseste emoji-uri moderat&#10;✅ Include CTA in fiecare postare&#10;❌ Nu folosi jargon tehnic&#10;❌ Nu compara cu competitorii"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>

        {/* Competitor notes */}
        <Section icon={Eye} title="Note competitive" hint="Observatii despre piata si diferentiere">
          <textarea
            value={form.competitor_notes}
            onChange={(e) => setForm((f) => ({ ...f, competitor_notes: e.target.value }))}
            rows={3}
            placeholder="Ex: Concurentii se concentreaza pe pret, noi pe calitate..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </Section>
      </div>

      {/* Bottom save bar */}
      <div className="mt-8 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-[13px] text-zinc-500">Aceste informatii ghideaza AI-ul cand genereaza postari</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salveaza profilul
        </button>
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-400" />
        <div>
          <p className="text-[13px] font-medium text-zinc-900">{title}</p>
          <p className="text-[11px] text-zinc-400">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
