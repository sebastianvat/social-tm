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
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Adauga brand nou</h1>
        <p className="mt-1 text-sm text-zinc-500">Pune URL-ul website-ului si noi facem restul</p>
      </div>

      <form onSubmit={handleScan} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <label htmlFor="url" className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Globe className="h-4 w-4" />
            URL Website
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800"
            placeholder="https://magazinul-tau.ro"
            required
          />
          <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
            <Coins className="h-3 w-3" />
            Costa {TOKEN_COSTS.SCAN_WEBSITE} tokeni
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-50 p-3 text-sm text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-medium text-white hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Se scaneaza...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Scaneaza website-ul
            </>
          )}
        </button>
      </form>
    </div>
  )
}
