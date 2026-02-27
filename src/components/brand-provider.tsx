"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface Brand {
  id: string
  name: string
  url: string
}

interface BrandContextType {
  brands: Brand[]
  selectedBrandId: string | null
  selectedBrand: Brand | null
  selectBrand: (brandId: string | null) => void
}

const BrandContext = createContext<BrandContextType>({
  brands: [],
  selectedBrandId: null,
  selectedBrand: null,
  selectBrand: () => {},
})

export function useBrand() {
  return useContext(BrandContext)
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`
}

export function BrandProvider({
  brands,
  initialBrandId,
  children,
}: {
  brands: Brand[]
  initialBrandId: string | null
  children: ReactNode
}) {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialBrandId)
  const router = useRouter()

  const selectBrand = useCallback(
    (brandId: string | null) => {
      setSelectedBrandId(brandId)
      if (brandId) {
        setCookie("selected_brand", brandId)
      } else {
        deleteCookie("selected_brand")
      }
      router.refresh()
    },
    [router]
  )

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null

  return (
    <BrandContext.Provider value={{ brands, selectedBrandId, selectedBrand, selectBrand }}>
      {children}
    </BrandContext.Provider>
  )
}
