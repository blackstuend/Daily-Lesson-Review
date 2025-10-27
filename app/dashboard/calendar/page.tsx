"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStore } from "@/stores/dashboard-store"
import { ChevronLeft, ChevronRight } from "lucide-react"

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function CalendarPage() {
  const searchParams = useSearchParams()

  const now = useMemo(() => new Date(), [])
  const currentMonth = useMemo(() => {
    const value = searchParams.get("month")
    const parsed = value ? Number.parseInt(value) : Number.NaN
    return Number.isNaN(parsed) ? now.getMonth() : parsed
  }, [searchParams, now])

  const currentYear = useMemo(() => {
    const value = searchParams.get("year")
    const parsed = value ? Number.parseInt(value) : Number.NaN
    return Number.isNaN(parsed) ? now.getFullYear() : parsed
  }, [searchParams, now])

  const fetchCalendarData = useDashboardStore((state) => state.fetchCalendarData)
  const calendarData = useDashboardStore((state) => state.calendarData)
  const calendarLoadingKeys = useDashboardStore((state) => state.calendarLoadingKeys)
  const calendarError = useDashboardStore((state) => state.calendarError)

  const calendarKey = `${currentYear}-${currentMonth}` as const
  const reviews = calendarData[calendarKey] ?? []

  useEffect(() => {
    void fetchCalendarData(currentMonth, currentYear)
  }, [fetchCalendarData, currentMonth, currentYear])

  if (calendarError && !reviews.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            <p>{calendarError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (calendarLoadingKeys.has(calendarKey) && !reviews.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-3">
          <div className="h-10 w-64 animate-pulse rounded bg-accent" />
          <div className="h-5 w-72 animate-pulse rounded bg-accent" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 14 }).map((_, index) => (
            <div key={index} className="aspect-square rounded border">
              <div className="h-full w-full animate-pulse rounded bg-accent" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  const reviewsByDate = reviews.reduce<Record<string, typeof reviews>>((acc, review) => {
    const date = review.review_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(review)
    return acc
  }, {})

  const completedCount = reviews.filter((review) => review.completed).length
  const pendingCount = reviews.length - completedCount

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Learning Calendar</h1>
        <p className="text-muted-foreground">Visualize your review schedule and track your progress</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/calendar?month=${prevMonth}&year=${prevYear}`}
                className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                href={`/dashboard/calendar?month=${nextMonth}&year=${nextYear}`}
                className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <CardDescription>Click on a date to see scheduled reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const date = new Date(currentYear, currentMonth, day)
              const dateString = date.toISOString().split("T")[0]
              const dayReviews = reviewsByDate[dateString] ?? []
              const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()

              const completedForDay = dayReviews.filter((review) => review.completed).length
              const totalForDay = dayReviews.length

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-2 ${isToday ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-1 text-sm font-medium">{day}</div>
                    {totalForDay > 0 && (
                      <div className="mt-auto space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {completedForDay}/{totalForDay}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {dayReviews.slice(0, 3).map((review) => (
                            <div
                              key={review.id}
                              className={`h-1.5 w-1.5 rounded-full ${review.completed ? "bg-green-500" : "bg-yellow-500"}`}
                            />
                          ))}
                          {dayReviews.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayReviews.length - 3}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This Month&apos;s Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Reviews:</span>
              <span className="font-medium">{reviews.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium text-green-600">{completedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-medium text-yellow-600">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Intervals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[0, 1, 3, 7].map((interval) => {
              const count = reviews.filter((review) => review.review_interval === interval).length
              return (
                <div key={interval} className="flex justify-between">
                  <span className="text-muted-foreground">{interval === 0 ? "Same Day" : `Day ${interval}`}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
