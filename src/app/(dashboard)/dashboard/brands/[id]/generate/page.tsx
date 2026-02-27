"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Sparkles, Loader2, Coins, Calendar, Check } from "lucide-react"
import { TOKEN_COSTS } from "@/lib/tokens"

const MONTHS = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"]
const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
]

export default function GenerateCalendarPage() {
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [postCount, setPostCount] = useState(30)
  const [platforms, setPlatforms] = useState(["facebook", "instagram"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ calendarId: string; postCount: number; tokensUsed: number } | null>(null)

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleGenerate() {
    if (platforms.length === 0) {
      setError("Selecteaza cel putin o platforma")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/generate/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, month, year, postCount, platforms }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Eroare la generare")
        setLoading(false)
        return
      }

      setResult(data)
      setLoading(false)
    } catch {
      setError("Eroare de conexiune")
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-lg">
        <div className="flex flex-col items-center text-center py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
            <Check className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Calendar generat!</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Am creat {result.postCount} postari pentru {MONTHS[month - 1]} {year}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {result.tokensUsed} tokeni utilizati
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/dashboard/calendar"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
            >
              <Calendar className="h-3.5 w-3.5" />
              Vezi calendarul
            </Link>
            <Link
              href={`/dashboard/brands/${brandId}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Inapoi la brand
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <Link
        href={`/dashboard/brands/${brandId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Inapoi la brand
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Genereaza calendar</h1>
        <p className="mt-1 text-sm text-zinc-500">AI-ul creeaza postari cu text si imagini</p>
      </div>

      <div className="space-y-6">
        {/* Month/Year */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="mb-3 text-[13px] font-medium text-zinc-900">Luna si anul</p>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Platforms */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="mb-3 text-[13px] font-medium text-zinc-900">Platforme</p>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={`flex h-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors ${
                  platforms.includes(p.id)
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                }`}
              >
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
              <button
                key={n}
                onClick={() => setPostCount(n)}
                className={`flex h-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors ${
                  postCount === n
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {n} postari
              </button>
            ))}
          </div>
        </div>

        {/* Cost summary */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-500">Cost total</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900">
              <Coins className="h-3.5 w-3.5 text-zinc-400" />
              {TOKEN_COSTS.GENERATE_CALENDAR} tokeni
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Se genereaza... (poate dura 30s)
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Genereaza {postCount} postari
            </>
          )}
        </button>
      </div>
    </div>
  )
}
