import { cache } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { handleSessionError } from "@/lib/auth-error-handler"

const REVIEW_SELECT = "*, lessons(*, linked_lesson:linked_lesson_id(id, title, lesson_type, link_url))"

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
  try {
    const supabase = await getSupabaseServerClient()
    const today = buildTodayString()

    const [{ data: todayReviews, error: todayError }, { count: totalLessons, error: lessonsError }] = await Promise.all([
      supabase
        .from("review_schedule")
        .select(REVIEW_SELECT)
        .eq("review_date", today)
        .order("completed", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("lessons").select("*", { count: "exact", head: true }),
    ])

    if (todayError == null) {
      // ok
    } else {
      const supabaseError = todayError
      handleSessionError(supabaseError)
      throw new Error(`Failed to fetch today's reviews: ${supabaseError.message}`)
    }
    if (lessonsError == null) {
      // ok
    } else {
      const supabaseError = lessonsError
      handleSessionError(supabaseError)
      throw new Error(`Failed to fetch total lessons: ${supabaseError.message}`)
    }

    return {
      todayReviews: todayReviews ?? [],
      totalLessons: totalLessons ?? 0,
    }
  } catch (error) {
    handleSessionError(error)
    throw error
  }
})

export type ReviewsData = {
  today: ReviewWithLesson[]
  upcoming: ReviewWithLesson[]
  past: ReviewWithLesson[]
}

export const getReviewsData = cache(async (): Promise<ReviewsData> => {
  try {
    const supabase = await getSupabaseServerClient()
    const today = buildTodayString()

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekString = nextWeek.toISOString().split("T")[0]

    const [todayResult, upcomingResult, pastResult] = await Promise.all([
      supabase
        .from("review_schedule")
        .select(REVIEW_SELECT)
        .eq("review_date", today)
        .order("completed", { ascending: true })
        .order("review_interval", { ascending: true }),
      supabase
        .from("review_schedule")
        .select(REVIEW_SELECT)
        .gt("review_date", today)
        .lte("review_date", nextWeekString)
        .order("review_date", { ascending: true }),
      supabase
        .from("review_schedule")
        .select(REVIEW_SELECT)
        .lt("review_date", today)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(20),
    ])

    if (todayResult.error == null) {
      // ok
    } else {
      const supabaseError = todayResult.error
      handleSessionError(supabaseError)
      throw new Error(`Failed to fetch today's reviews: ${supabaseError.message}`)
    }
    if (upcomingResult.error == null) {
      // ok
    } else {
      const supabaseError = upcomingResult.error
      handleSessionError(supabaseError)
      throw new Error(`Failed to fetch upcoming reviews: ${supabaseError.message}`)
    }
    if (pastResult.error == null) {
      // ok
    } else {
      const supabaseError = pastResult.error
      handleSessionError(supabaseError)
      throw new Error(`Failed to fetch past reviews: ${supabaseError.message}`)
    }

    return {
      today: todayResult.data ?? [],
      upcoming: upcomingResult.data ?? [],
      past: pastResult.data ?? [],
    }
  } catch (error) {
    handleSessionError(error)
    throw error
  }
})

export const getCalendarData = cache(async (month: number, year: number): Promise<ReviewWithLesson[]> => {
  try {
    const supabase = await getSupabaseServerClient()

    // Get the first and last day of the current month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Calculate how many days from previous month to show
    const startingDayOfWeek = firstDay.getDay()
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    const prevMonthStartDay = prevMonthLastDay - startingDayOfWeek + 1

    // Calculate how many days from next month to show
    const endingDayOfWeek = lastDay.getDay()
    const nextMonthDays = 6 - endingDayOfWeek
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year

    // Build date strings in YYYY-MM-DD format to avoid timezone issues
    const startDate = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(prevMonthStartDay).padStart(2, "0")}`
    // If nextMonthDays is 0, use last day of current month; otherwise use nextMonthDays as the day of next month
    const endDate = nextMonthDays === 0
      ? `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`
      : `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextMonthDays).padStart(2, "0")}`

    const { data, error } = await supabase
      .from("review_schedule")
      .select(REVIEW_SELECT)
      .gte("review_date", startDate)
      .lte("review_date", endDate)

    if (error == null) {
      // ok
    } else {
      const supabaseError = error
      handleSessionError(supabaseError)
      throw new Error(`Failed to fetch calendar data: ${supabaseError.message}`)
    }

    return data ?? []
  } catch (error) {
    handleSessionError(error)
    throw error
  }
})
