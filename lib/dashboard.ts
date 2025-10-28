import { cache } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type ReviewWithLesson = {
  id: string
  review_date: string
  completed: boolean
  completed_at: string | null
  review_interval: number
  lessons: any
  [key: string]: any
}

export type DashboardData = {
  todayReviews: ReviewWithLesson[]
  totalLessons: number
}

function buildTodayString() {
  return new Date().toISOString().split("T")[0]
}

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = await getSupabaseServerClient()
  const today = buildTodayString()

  const [{ data: todayReviews, error: todayError }, { count: totalLessons, error: lessonsError }] = await Promise.all([
    supabase
      .from("review_schedule")
      .select("*, lessons(*)")
      .eq("review_date", today)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
  ])

  if (todayError) {
    throw new Error(`Failed to fetch today's reviews: ${todayError.message}`)
  }
  if (lessonsError) {
    throw new Error(`Failed to fetch total lessons: ${lessonsError.message}`)
  }

  return {
    todayReviews: todayReviews ?? [],
    totalLessons: totalLessons ?? 0,
  }
})
