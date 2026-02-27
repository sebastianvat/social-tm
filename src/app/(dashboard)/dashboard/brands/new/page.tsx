"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Loader2, Sparkles, Coins } from "lucide-react"
import { TOKEN_COSTS } from "@/lib/tokens"

export default function NewBrandPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setStatus("Se scaneaza website-ul...")

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Eroare la scanare")
        setLoading(false)
        return
      }

      setStatus(`Gata! Am gasit ${data.productsFound} produse.`)
      setTimeout(() => router.push(`/dashboard/brands/${data.brandId}`), 1500)
    } catch {
      setError("Eroare de conexiune")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Adauga brand nou</h1>
        <p className="mt-1 text-sm text-zinc-500">Pune URL-ul website-ului si noi facem restul</p>
      </div>

      <form onSubmit={handleScan} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <label htmlFor="url" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700">
            <Globe className="h-4 w-4 text-zinc-400" />
            URL Website
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="https://magazinul-tau.ro"
            required
          />
          <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400">
            <Coins className="h-3 w-3" />
            Costa {TOKEN_COSTS.SCAN_WEBSITE} tokeni
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
            <Sparkles className="h-4 w-4 text-zinc-500" />
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Se scaneaza...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Scaneaza website-ul
            </>
          )}
        </button>
      </form>
    </div>
  )
}
