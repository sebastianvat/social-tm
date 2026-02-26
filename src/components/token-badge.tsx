"use client"

import { Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatTokens } from "@/lib/utils"

interface TokenBadgeProps {
  tokens: number
  size?: "sm" | "default" | "lg"
}

export function TokenBadge({ tokens, size = "default" }: TokenBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  return (
    <Badge variant="token" className={sizeClasses[size]}>
      <Coins className="mr-1 h-3.5 w-3.5" />
      {formatTokens(tokens)}
    </Badge>
  )
}
