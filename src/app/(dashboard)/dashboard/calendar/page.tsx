import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, Globe, ArrowRight, Sparkles } from "lucide-react"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, url")
    .eq("user_id", user.id)

  const { data: calendars } = await supabase
    .from("content_calendars")
    .select("*, brands(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-500">Calendarele tale de continut generate cu AI</p>
      </div>

      {calendars && calendars.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {calendars.map((cal) => (
            <Link
              key={cal.id}
              href={`/dashboard/calendar/${cal.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                    <Calendar className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {months[cal.month - 1]} {cal.year}
                    </h3>
                    <p className="text-sm text-zinc-500">{(cal as any).brands?.name} — {cal.post_count} postari</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-800">
          <Calendar className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">Niciun calendar inca</h3>
          <p className="mt-1 text-center text-sm text-zinc-500">
            Adauga un brand si genereaza primul calendar
          </p>
          {brands && brands.length > 0 ? (
            <Link
              href={`/dashboard/brands/${brands[0].id}`}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-medium text-white hover:from-violet-700 hover:to-indigo-700"
            >
              <Sparkles className="h-4 w-4" />
              Genereaza calendar
            </Link>
          ) : (
            <Link
              href="/dashboard/brands/new"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-medium text-white hover:from-violet-700 hover:to-indigo-700"
            >
              <Globe className="h-4 w-4" />
              Adauga brand intai
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
