"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Globe,
  Calendar,
  Coins,
  Settings,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TokenBadge } from "@/components/token-badge"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Branduri", href: "/dashboard/brands", icon: Globe },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Tokeni", href: "/dashboard/tokens", icon: Coins },
  { name: "Setari", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  tokens: number
}

export function Sidebar({ tokens }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight text-zinc-900">Social TM</span>
          <span className="text-[10px] leading-tight text-zinc-400">by Transilvania Marketing</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-emerald-600")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-100 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Tokeni</span>
          <TokenBadge tokens={tokens} />
        </div>
      </div>
    </aside>
  )
}
