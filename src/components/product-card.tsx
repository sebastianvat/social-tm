"use client"

import { useState } from "react"
import { Package, ExternalLink } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string | null
  price: string | null
  image_url: string | null
  url: string | null
}

function displayPrice(raw: string | null): string | null {
  if (!raw) return null
  const normalized = raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
  const match = normalized.match(/([\d.,]+)\s*(lei|ron|eur|€|\$|usd)/i)
  if (match) return `${match[1]} ${match[2]}`
  if (/^[\d.,]+$/.test(normalized)) return normalized
  return normalized.slice(0, 20)
}

export function ProductCardMini({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false)
  const price = displayPrice(product.price)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 transition-colors hover:border-zinc-300">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-7 w-7 flex-shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-zinc-200">
            <Package className="h-3 w-3 text-zinc-400" />
          </div>
        )}
        <span className="max-w-[120px] truncate text-[11px] font-medium text-zinc-700">
          {product.name}
        </span>
        {price && (
          <span className="flex-shrink-0 text-[10px] font-semibold text-zinc-900">{price}</span>
        )}
      </div>

      {hovered && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
          <div className="flex gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Package className="h-6 w-6 text-zinc-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-zinc-900">{product.name}</p>
              {price && (
                <p className="mt-0.5 text-[13px] font-semibold text-zinc-900">{price}</p>
              )}
              {product.description && (
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-zinc-500">
                  {product.description}
                </p>
              )}
            </div>
          </div>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600"
            >
              <ExternalLink className="h-3 w-3" />
              Vezi produsul
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function ProductSelector({
  products,
  selected,
  onToggle,
}: {
  products: Product[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {products.map((product) => {
        const isSelected = selected.has(product.id)
        const price = displayPrice(product.price)
        return (
          <button
            key={product.id}
            onClick={() => onToggle(product.id)}
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
              isSelected
                ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Package className="h-5 w-5 text-zinc-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[12px] font-medium text-zinc-900">{product.name}</p>
              {price && (
                <p className="mt-0.5 text-[11px] font-semibold text-zinc-700">{price}</p>
              )}
            </div>
            <div
              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900"
                  : "border-zinc-300"
              }`}
            >
              {isSelected && (
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
