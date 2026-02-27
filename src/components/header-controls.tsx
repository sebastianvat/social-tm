"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      )}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
