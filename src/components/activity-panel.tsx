"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, AlertCircle, ChevronDown, ChevronUp, Zap, Image, FileText, Calendar, Globe } from "lucide-react"
import { useActivity, type ActivityItem } from "./activity-provider"

const typeIcons: Record<string, React.ReactNode> = {
  image: <Image className="h-3 w-3" />,
  description: <FileText className="h-3 w-3" />,
  calendar: <Calendar className="h-3 w-3" />,
  scan: <Globe className="h-3 w-3" />,
}

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const [, setTick] = useState(0)
  useState(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  })
  const secs = Math.floor((Date.now() - startedAt) / 1000)
  return <span className="tabular-nums">{secs}s</span>
}

function StatusIcon({ status }: { status: ActivityItem["status"] }) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
  if (status === "done") return <Check className="h-3.5 w-3.5 text-green-500" />
  return <AlertCircle className="h-3.5 w-3.5 text-red-500" />
}

export function ActivityPanel() {
  const { activities, runningCount } = useActivity()
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)

  if (activities.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between bg-zinc-900 px-3 py-2 text-white"
      >
        <div className="flex items-center gap-2">
          {runningCount > 0 ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          <span className="text-[12px] font-medium">
            {runningCount > 0
              ? `${runningCount} proces${runningCount > 1 ? "e" : ""} activ${runningCount > 1 ? "e" : ""}`
              : "Procese finalizate"}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
        )}
      </button>

      {/* Items */}
      {expanded && (
        <div className="max-h-48 overflow-y-auto">
          {activities.map((item) => {
            const isClickable = !!item.href
            const Tag = isClickable ? "button" : "div"
            return (
              <Tag
                key={item.id}
                onClick={isClickable ? () => router.push(item.href!) : undefined}
                className={`flex w-full items-center gap-2.5 border-b border-zinc-50 px-3 py-2 text-left last:border-0 ${
                  item.status === "done" ? "bg-green-50/50" :
                  item.status === "error" ? "bg-red-50/50" : ""
                } ${isClickable ? "cursor-pointer hover:bg-zinc-50" : ""}`}
              >
                <StatusIcon status={item.status} />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="text-zinc-400">{typeIcons[item.type]}</span>
                  <span className={`truncate text-[11px] ${isClickable ? "text-zinc-900 underline decoration-zinc-300" : "text-zinc-700"}`}>
                    {item.label}
                  </span>
                </div>
                {item.status === "running" && (
                  <span className="flex-shrink-0 text-[10px] text-zinc-400">
                    <ElapsedTime startedAt={item.startedAt} />
                  </span>
                )}
                {item.status === "done" && (
                  <span className="flex-shrink-0 text-[10px] text-green-600">
                    {isClickable ? "Vezi →" : "Gata"}
                  </span>
                )}
                {item.status === "error" && (
                  <span className="flex-shrink-0 text-[10px] text-red-500">Eroare</span>
                )}
              </Tag>
            )
          })}
        </div>
      )}
    </div>
  )
}
