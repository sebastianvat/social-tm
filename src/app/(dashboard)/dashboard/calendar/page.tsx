import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react"

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
  promo: "bg-zinc-900",
  educational: "bg-zinc-600",
  engagement: "bg-zinc-400",
  brand_story: "bg-zinc-300",
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-zinc-100 text-zinc-600" },
  approved: { label: "Aprobat", class: "bg-zinc-200 text-zinc-700" },
  scheduled: { label: "Programat", class: "bg-zinc-800 text-white" },
  published: { label: "Publicat", class: "bg-zinc-900 text-white" },
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

  // Read selected brand from cookie
  const cookieStore = await cookies()
  const selectedBrandId = cookieStore.get("selected_brand")?.value || null

  let postsQuery = supabase
    .from("posts")
    .select("*, brands(name)")
    .eq("user_id", user.id)
    .gte("scheduled_at", startOfMonth)
    .lte("scheduled_at", endOfMonth)
    .order("scheduled_at", { ascending: true })

  if (selectedBrandId) {
    postsQuery = postsQuery.eq("brand_id", selectedBrandId)
  }

  const { data: posts } = await postsQuery

  // Get brand info for header
  let brandName: string | null = null
  if (selectedBrandId) {
    const { data: brand } = await supabase.from("brands").select("name").eq("id", selectedBrandId).single()
    brandName = brand?.name || null
  }

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

  const totalPosts = posts?.length || 0

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <CalendarIcon className="h-3.5 w-3.5" />
            Astazi: {today} {MONTHS[todayMonth - 1]} {todayYear}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Calendar{brandName ? ` — ${brandName}` : ""}
          </h1>
          {totalPosts > 0 && (
            <p className="mt-0.5 text-[13px] text-zinc-400">
              {totalPosts} postari in {MONTHS[currentMonth - 1]}
            </p>
          )}
        </div>
        {selectedBrandId && (
          <Link
            href={`/dashboard/brands/${selectedBrandId}/generate`}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-[13px] font-medium text-white hover:bg-zinc-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Genereaza calendar
          </Link>
        )}
      </div>

      {isCurrentMonth && todayPosts.length > 0 && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="flex items-center gap-2 text-[13px] font-medium text-zinc-900">
            <Clock className="h-4 w-4 text-zinc-400" />
            Postari programate astazi — {today} {MONTHS[currentMonth - 1]}
          </h2>
          <div className="mt-3 space-y-2">
            {todayPosts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/posts?expand=${post.id}`}
                className="flex items-center justify-between rounded-lg bg-white border border-zinc-100 p-3 transition-colors hover:border-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${POST_TYPE_COLORS[post.post_type] || "bg-zinc-400"}`} />
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900 line-clamp-1">{post.content.substring(0, 80)}...</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                      <span>{post.platform}</span>
                      <span>·</span>
                      <span>{post.scheduled_at ? new Date(post.scheduled_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    </div>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_LABELS[post.status]?.class || "bg-zinc-100 text-zinc-600"}`}>
                  {STATUS_LABELS[post.status]?.label || post.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isCurrentMonth && todayPosts.length === 0 && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center">
          <p className="text-sm text-zinc-500">
            Nicio postare programata astazi{brandName ? ` pentru ${brandName}` : ""}.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-sm font-semibold text-zinc-900">
          {MONTHS[currentMonth - 1]} {currentYear}
        </h2>
        <Link
          href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-[11px] font-medium text-zinc-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-zinc-100 bg-zinc-50/30 p-1.5" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = isCurrentMonth && day === today
            const dayPosts = postsByDay[day] || []

            return (
              <div
                key={day}
                className={`min-h-[90px] border-b border-r border-zinc-100 p-1.5 transition-colors ${
                  isToday ? "bg-zinc-50 ring-2 ring-inset ring-zinc-900" : "hover:bg-zinc-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                    isToday
                      ? "bg-zinc-900 text-white"
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
                    <Link
                      key={post.id}
                      href={`/dashboard/posts?expand=${post.id}`}
                      className="flex items-center gap-1 rounded px-1 py-0.5 bg-zinc-100 transition-colors hover:bg-zinc-200"
                    >
                      <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${POST_TYPE_COLORS[post.post_type] || "bg-zinc-400"}`} />
                      <span className="truncate text-[10px] text-zinc-600">{post.platform}</span>
                    </Link>
                  ))}
                  {dayPosts.length > 3 && (
                    <Link href="/dashboard/posts" className="block text-[10px] text-zinc-400 px-1 hover:text-zinc-600">+{dayPosts.length - 3} mai mult</Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
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
