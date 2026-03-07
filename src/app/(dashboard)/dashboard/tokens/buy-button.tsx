"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export function BuyButton({ packId }: { packId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleBuy() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Eroare la plata")
        setLoading(false)
      }
    } catch {
      alert("Eroare la conectarea cu serverul")
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="mt-4 flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cumpara"}
    </button>
  )
}
