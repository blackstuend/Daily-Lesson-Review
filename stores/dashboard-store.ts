"use client"

import { create } from "zustand"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"

type ReviewWithLesson = {
  id: string
  review_date: string
  completed: boolean
  completed_at: string | null
  review_interval: number
  lessons: any
  [key: string]: any
}

type DashboardData = {
  todayReviews: ReviewWithLesson[]
  pendingCount: number
  totalLessons: number
}

type ReviewsData = {
  today: ReviewWithLesson[]
  upcoming: ReviewWithLesson[]
  past: ReviewWithLesson[]
}

type CalendarKey = `${number}-${number}`

type DashboardStore = {
  user: User | null
  isLoadingUser: boolean
  userError?: string
  fetchUser: () => Promise<User | null>
  dashboardData: DashboardData | null
  isLoadingDashboard: boolean
  dashboardError?: string
  fetchDashboardData: () => Promise<void>
  reviewsData: ReviewsData | null
  isLoadingReviews: boolean
  reviewsError?: string
  fetchReviewsData: () => Promise<void>
  calendarData: Record<CalendarKey, ReviewWithLesson[]>
  calendarLoadingKeys: Set<CalendarKey>
  calendarError?: string
  fetchCalendarData: (month: number, year: number) => Promise<void>
  reset: () => void
}

function buildTodayString() {
  return new Date().toISOString().split("T")[0]
}

function buildCalendarKey(month: number, year: number): CalendarKey {
  return `${year}-${month}` as CalendarKey
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  user: null,
  isLoadingUser: false,
  dashboardData: null,
  isLoadingDashboard: false,
  reviewsData: null,
  isLoadingReviews: false,
  calendarData: {},
  calendarLoadingKeys: new Set(),

  fetchUser: async () => {
    const { user, isLoadingUser } = get()
    if (user || isLoadingUser) {
      return user
    }

    set({ isLoadingUser: true, userError: undefined })

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        throw error
      }
      const nextUser = data.user ?? null
      set({ user: nextUser })
      return nextUser
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load user information."
      set({ userError: message })
      return null
    } finally {
      set({ isLoadingUser: false })
    }
  },

  fetchDashboardData: async () => {
    const { dashboardData, isLoadingDashboard } = get()
    if (dashboardData || isLoadingDashboard) {
      return
    }

    set({ isLoadingDashboard: true, dashboardError: undefined })

    try {
      const supabase = createClient()
      const today = buildTodayString()

      const [{ data: todayReviews, error: todayError }, { count: totalLessons, error: lessonsError }] = await Promise.all(
        [
          supabase
            .from("review_schedule")
            .select("*, lessons(*)")
            .eq("review_date", today)
            .order("completed", { ascending: true })
            .order("created_at", { ascending: false }),
          supabase.from("lessons").select("*", { count: "exact", head: true }),
        ],
      )

      if (todayError) {
        throw todayError
      }
      if (lessonsError) {
        throw lessonsError
      }

      const pendingCount = (todayReviews ?? []).filter((review) => !review.completed).length

      set({
        dashboardData: {
          todayReviews: todayReviews ?? [],
          pendingCount,
          totalLessons: totalLessons ?? 0,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load dashboard data."
      set({ dashboardError: message })
    } finally {
      set({ isLoadingDashboard: false })
    }
  },

  fetchReviewsData: async () => {
    const { reviewsData, isLoadingReviews } = get()
    if (reviewsData || isLoadingReviews) {
      return
    }

    set({ isLoadingReviews: true, reviewsError: undefined })

    try {
      const supabase = createClient()
      const today = buildTodayString()

      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekString = nextWeek.toISOString().split("T")[0]

      const [todayResult, upcomingResult, pastResult] = await Promise.all([
        supabase
          .from("review_schedule")
          .select("*, lessons(*)")
          .eq("review_date", today)
          .order("completed", { ascending: true })
          .order("review_interval", { ascending: true }),
        supabase
          .from("review_schedule")
          .select("*, lessons(*)")
          .gt("review_date", today)
          .lte("review_date", nextWeekString)
          .order("review_date", { ascending: true }),
        supabase
          .from("review_schedule")
          .select("*, lessons(*)")
          .lt("review_date", today)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(20),
      ])

      if (todayResult.error) throw todayResult.error
      if (upcomingResult.error) throw upcomingResult.error
      if (pastResult.error) throw pastResult.error

      set({
        reviewsData: {
          today: todayResult.data ?? [],
          upcoming: upcomingResult.data ?? [],
          past: pastResult.data ?? [],
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load reviews data."
      set({ reviewsError: message })
    } finally {
      set({ isLoadingReviews: false })
    }
  },

  fetchCalendarData: async (month: number, year: number) => {
    const key = buildCalendarKey(month, year)
    const { calendarData, calendarLoadingKeys } = get()

    if (calendarData[key] || calendarLoadingKeys.has(key)) {
      return
    }

    const nextLoadingKeys = new Set(calendarLoadingKeys)
    nextLoadingKeys.add(key)
    set({ calendarLoadingKeys: nextLoadingKeys, calendarError: undefined })

    try {
      const supabase = createClient()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const { data, error } = await supabase
        .from("review_schedule")
        .select("*, lessons(*)")
        .gte("review_date", firstDay.toISOString().split("T")[0])
        .lte("review_date", lastDay.toISOString().split("T")[0])

      if (error) {
        throw error
      }

      set((state) => ({
        calendarData: {
          ...state.calendarData,
          [key]: data ?? [],
        },
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load calendar data."
      set({ calendarError: message })
    } finally {
      set((state) => {
        const updated = new Set(state.calendarLoadingKeys)
        updated.delete(key)
        return { calendarLoadingKeys: updated }
      })
    }
  },

  reset: () => {
    set({
      user: null,
      userError: undefined,
      isLoadingUser: false,
      dashboardData: null,
      dashboardError: undefined,
      isLoadingDashboard: false,
      reviewsData: null,
      reviewsError: undefined,
      isLoadingReviews: false,
      calendarData: {},
      calendarLoadingKeys: new Set(),
      calendarError: undefined,
    })
  },
}))
