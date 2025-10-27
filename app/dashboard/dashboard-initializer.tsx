"use client"

import { useEffect } from "react"

import { useDashboardStore } from "@/stores/dashboard-store"

export function DashboardInitializer() {
  const fetchUser = useDashboardStore((state) => state.fetchUser)
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)
  const fetchReviewsData = useDashboardStore((state) => state.fetchReviewsData)
  const fetchCalendarData = useDashboardStore((state) => state.fetchCalendarData)

  useEffect(() => {
    let isActive = true

    async function initialize() {
      const user = await fetchUser()
      if (!isActive || !user) {
        return
      }

      const now = new Date()
      await Promise.allSettled([
        fetchDashboardData(),
        fetchReviewsData(),
        fetchCalendarData(now.getMonth(), now.getFullYear()),
      ])
    }

    void initialize()

    return () => {
      isActive = false
    }
  }, [fetchUser, fetchDashboardData, fetchReviewsData, fetchCalendarData])

  return null
}
