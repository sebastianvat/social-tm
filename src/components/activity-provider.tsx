"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export type ActivityItem = {
  id: string
  type: "image" | "description" | "calendar" | "scan"
  label: string
  status: "running" | "done" | "error"
  startedAt: number
}

type ActivityContextType = {
  activities: ActivityItem[]
  addActivity: (item: Omit<ActivityItem, "status" | "startedAt">) => void
  updateActivity: (id: string, status: ActivityItem["status"]) => void
  removeActivity: (id: string) => void
  isRunning: (id: string) => boolean
  runningCount: number
}

const ActivityContext = createContext<ActivityContextType | null>(null)

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  const addActivity = useCallback((item: Omit<ActivityItem, "status" | "startedAt">) => {
    setActivities((prev) => {
      const exists = prev.find((a) => a.id === item.id)
      if (exists && exists.status === "running") return prev
      return [
        ...prev.filter((a) => a.id !== item.id),
        { ...item, status: "running" as const, startedAt: Date.now() },
      ]
    })
  }, [])

  const updateActivity = useCallback((id: string, status: ActivityItem["status"]) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
    if (status === "done" || status === "error") {
      setTimeout(() => {
        setActivities((prev) => prev.filter((a) => a.id !== id))
      }, 3000)
    }
  }, [])

  const removeActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const isRunning = useCallback(
    (id: string) => activities.some((a) => a.id === id && a.status === "running"),
    [activities]
  )

  const runningCount = activities.filter((a) => a.status === "running").length

  return (
    <ActivityContext.Provider
      value={{ activities, addActivity, updateActivity, removeActivity, isRunning, runningCount }}
    >
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider")
  return ctx
}
