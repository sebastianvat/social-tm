import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sparkles, Globe, Send } from "lucide-react"

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

const MONTHS = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"]
const DAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sam", "Dum"]

const POST_TYPE_COLORS: Record<string, string> = {
  promo: "bg-blue-500",
  educational: "bg-violet-500",
  engagement: "bg-amber-500",
  brand_story: "bg-pink-500",
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-zinc-100 text-zinc-600" },
  approved: { label: "Aprobat", class: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Programat", class: "bg-emerald-100 text-emerald-700" },
  published: { label: "Publicat", class: "bg-emerald-500 text-white" },
  failed: { label: "Eroare", class: "bg-red-100 text-red-700" },
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const now = new Date()
  const currentMonth = params.month ? parseInt(params.month) : now.getMonth() + 1
  const currentYear = params.year ? parseInt(params.year) : now.getFullYear()

  const today = now.getDate()
  const todayMonth = now.getMonth() + 1
  const todayYear = now.getFullYear()
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString()
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()

  const { data: posts } = await supabase
    .from("posts")
    .select("*, brands(name)")
    .eq("user_id", user.id)
    .gte("scheduled_at", startOfMonth)
    .lte("scheduled_at", endOfMonth)
    .order("scheduled_at", { ascending: true })

  const postsByDay: Record<number, typeof posts> = {}
  posts?.forEach((post) => {
    if (post.scheduled_at) {
      const day = new Date(post.scheduled_at).getDate()
      if (!postsByDay[day]) postsByDay[day] = []
      postsByDay[day]!.push(post)
    }
  })

  const todayPosts = isCurrentMonth ? (postsByDay[today] || []) : []

  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .eq("user_id", user.id)

  return (
    <div>
      {/* Header with date */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <CalendarIcon className="h-4 w-4" />
            Astazi: {today} {MONTHS[todayMonth - 1]} {todayYear}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">Calendar</h1>
        </div>
        {brands && brands.length > 0 && (
          <Link
            href={`/dashboard/brands/${brands[0].id}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Sparkles className="h-4 w-4" />
            Genereaza calendar
          </Link>
        )}
      </div>

      {/* Today's posts */}
      {isCurrentMonth && todayPosts.length > 0 && (
        <div className="mb-8 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Clock className="h-4 w-4" />
            Postari programate astazi — {today} {MONTHS[currentMonth - 1]}
          </h2>
          <div className="mt-3 space-y-2">
            {todayPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${POST_TYPE_COLORS[post.post_type] || "bg-zinc-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 line-clamp-1">{post.content.substring(0, 80)}...</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{post.platform}</span>
                      <span>•</span>
                      <span>{post.scheduled_at ? new Date(post.scheduled_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[post.status]?.class || "bg-zinc-100 text-zinc-600"}`}>
                  {STATUS_LABELS[post.status]?.label || post.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCurrentMonth && todayPosts.length === 0 && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center">
          <p className="text-sm text-zinc-500">Nicio postare programata astazi.</p>
        </div>
      )}

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-bold text-zinc-900">
          {MONTHS[currentMonth - 1]} {currentYear}
        </h2>
        <Link
          href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-zinc-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-zinc-100 bg-zinc-50/30 p-1.5" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = isCurrentMonth && day === today
            const dayPosts = postsByDay[day] || []
            const cellIndex = firstDay + i

            return (
              <div
                key={day}
                className={`min-h-[100px] border-b border-r border-zinc-100 p-1.5 transition-colors ${
                  isToday ? "bg-emerald-50 ring-2 ring-inset ring-emerald-500" : "hover:bg-zinc-50/50"
                } ${cellIndex % 7 >= 5 ? "bg-zinc-50/30" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-emerald-500 text-white"
                      : "text-zinc-700"
                  }`}>
                    {day}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] font-medium text-zinc-400">{dayPosts.length}p</span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={`flex items-center gap-1 rounded px-1 py-0.5 ${
                        post.status === "published" ? "bg-emerald-100" : "bg-zinc-100"
                      }`}
                    >
                      <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${POST_TYPE_COLORS[post.post_type] || "bg-zinc-400"}`} />
                      <span className="truncate text-[10px] text-zinc-600">{post.platform}</span>
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="block text-[10px] text-zinc-400 px-1">+{dayPosts.length - 3} mai mult</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="font-medium">Tip postare:</span>
        {Object.entries(POST_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="capitalize">{type === "brand_story" ? "brand story" : type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
