"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Globe,
  Calendar,
  FileText,
  Coins,
  Settings,
  Zap,
  Sparkles,
  Send,
  BarChart3,
  ArrowUpRight,
  ChevronDown,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTokens } from "@/lib/utils"
import { useBrand } from "./brand-provider"
import { useState, useRef, useEffect } from "react"

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Postari", href: "/dashboard/posts", icon: FileText },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
]

const toolsNav = [
  { name: "Genereaza continut", href: "/dashboard/brands/new", icon: Sparkles },
  { name: "Auto-posting", href: "/dashboard/posting", icon: Send },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
]

interface SidebarProps {
  tokens: number
}

export function Sidebar({ tokens }: SidebarProps) {
  const pathname = usePathname()
  const { brands, selectedBrand, selectBrand } = useBrand()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-100 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-900">Social TM</span>
      </div>

      {/* Brand selector */}
      {brands.length > 0 && (
        <div className="px-3 pb-3" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-bold text-white">
              {selectedBrand?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-900">
                {selectedBrand?.name || "Selecteaza brand"}
              </p>
              {selectedBrand?.url && (
                <p className="truncate text-[10px] text-zinc-400">{selectedBrand.url.replace(/^https?:\/\//, "")}</p>
              )}
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-[228px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
              {brands.map((brand) => {
                const isActive = brand.id === selectedBrand?.id
                return (
                  <button
                    key={brand.id}
                    onClick={() => {
                      selectBrand(brand.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-zinc-50",
                      isActive && "bg-zinc-50"
                    )}
                  >
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-600">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-zinc-900">{brand.name}</p>
                      <p className="truncate text-[10px] text-zinc-400">{brand.url.replace(/^https?:\/\//, "")}</p>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 flex-shrink-0 text-zinc-900" />}
                  </button>
                )
              })}
              <div className="my-1 border-t border-zinc-100" />
              <Link
                href="/dashboard/brands"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-500 hover:bg-zinc-50"
              >
                <Globe className="h-4 w-4 text-zinc-400" />
                Gestioneaza branduri
              </Link>
              <Link
                href="/dashboard/brands/new"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-500 hover:bg-zinc-50"
              >
                <Sparkles className="h-4 w-4 text-zinc-400" />
                Adauga brand nou
              </Link>
            </div>
          )}
        </div>
      )}

      {brands.length === 0 && (
        <div className="px-3 pb-3">
          <Link
            href="/dashboard/brands/new"
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-3 text-[13px] text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <Sparkles className="h-4 w-4 text-zinc-400" />
            Adauga primul brand
          </Link>
        </div>
      )}

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-zinc-900" : "text-zinc-400")} />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Tools section */}
        <div className="mt-6">
          <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Instrumente
          </p>
          <div className="space-y-0.5">
            {toolsNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-zinc-900" : "text-zinc-400")} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Account section */}
        <div className="mt-6">
          <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Cont
          </p>
          <div className="space-y-0.5">
            <Link
              href="/dashboard/tokens"
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                pathname === "/dashboard/tokens"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Coins className={cn("h-4 w-4", pathname === "/dashboard/tokens" ? "text-zinc-900" : "text-zinc-400")} />
              Tokeni
            </Link>
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                pathname === "/dashboard/settings"
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Settings className={cn("h-4 w-4", pathname === "/dashboard/settings" ? "text-zinc-900" : "text-zinc-400")} />
              Setari
            </Link>
          </div>
        </div>
      </nav>

      {/* Token balance + Upgrade */}
      <div className="border-t border-zinc-100 p-3">
        <div className="mb-2 flex items-center justify-between px-2.5">
          <span className="text-[11px] font-medium text-zinc-400">Tokeni ramasi</span>
          <span className="text-[13px] font-semibold text-zinc-900">{formatTokens(tokens)}</span>
        </div>
        <div className="mb-2 mx-2.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all"
              style={{ width: `${Math.min((tokens / 500) * 100, 100)}%` }}
            />
          </div>
        </div>
        <Link
          href="/dashboard/tokens"
          className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-zinc-200 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          Cumpara tokeni
        </Link>
      </div>
    </aside>
  )
}
