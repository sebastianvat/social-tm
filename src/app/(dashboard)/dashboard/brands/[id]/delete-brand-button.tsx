"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

export function DeleteBrandButton({ brandId, brandName }: { brandId: string; brandName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/dashboard/brands")
    } else {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-red-600">Stergi {brandName} si toate datele?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Da, sterge
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="inline-flex h-8 items-center rounded-lg border border-zinc-200 px-3 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50"
        >
          Anuleaza
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-[12px] font-medium text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-3 w-3" />
      Sterge brand
    </button>
  )
}
