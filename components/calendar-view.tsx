"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type ReviewWithLesson = {
  id: string
  review_date: string
  completed: boolean
  completed_at: string | null
  review_interval: number
  lessons: any
  [key: string]: any
}

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

type CalendarViewProps = {
  reviews: ReviewWithLesson[]
  currentMonth: number
  currentYear: number
}

export function CalendarView({ reviews, currentMonth, currentYear }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const now = new Date()

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
  const selectedReviews = selectedDate ? reviewsByDate[selectedDate] ?? [] : []
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : ""

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
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayReviews = reviewsByDate[dateString] ?? []
              const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()

              return (
                <div key={day} className="aspect-square">
                  <button
                    type="button"
                    onClick={() => dayReviews.length && setSelectedDate(dateString)}
                    className={cn(
                      "flex h-full w-full flex-col rounded-lg border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isToday ? "border-primary bg-primary/5" : "hover:bg-accent",
                      dayReviews.length ? "cursor-pointer" : "cursor-default opacity-60 hover:bg-transparent"
                    )}
                    disabled={!dayReviews.length}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{day}</div>
                      {dayReviews.length > 0 && (
                        <div className="text-xs text-muted-foreground">{dayReviews.length}</div>
                      )}
                    </div>

                    {dayReviews.length > 0 && (
                      <div className="mt-2 space-y-1 overflow-hidden">
                        {dayReviews.slice(0, 3).map((review) => {
                          const lessonTitle = review.lessons?.title ?? "Untitled lesson"
                          return (
                            <Link
                              key={review.id}
                              href={`/dashboard/review/${review.id}`}
                              className={cn(
                                "block truncate text-xs leading-tight hover:underline",
                                review.completed ? "text-emerald-600" : "text-amber-600"
                              )}
                              title={lessonTitle}
                              onClick={(e) => e.stopPropagation()}
                            >
                              - {lessonTitle}
                            </Link>
                          )
                        })}
                        {dayReviews.length > 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDate(dateString)
                            }}
                            className="truncate text-xs text-muted-foreground hover:underline"
                          >
                            +{dayReviews.length - 3} more...
                          </button>
                        )}
                      </div>
                    )}
                  </button>
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

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedDateLabel}</DialogTitle>
            <DialogDescription>
              {selectedReviews.length
                ? "Review the lessons scheduled for this day."
                : "No reviews scheduled for this date."}
            </DialogDescription>
          </DialogHeader>

          {selectedReviews.length > 0 && (
            <div className="space-y-3">
              {selectedReviews.map((review) => {
                const lessonTitle = review.lessons?.title ?? "Untitled lesson"
                const lessonTypeLabel = review.lessons?.lesson_type ?? "lesson"
                return (
                  <div key={review.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium leading-snug">{lessonTitle}</p>
                        <p className="text-sm text-muted-foreground capitalize">{lessonTypeLabel}</p>
                      </div>
                      <Badge variant={review.completed ? "secondary" : "outline"} className="whitespace-nowrap">
                        {review.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    <Link
                      href={`/dashboard/review/${review.id}`}
                      className="mt-2 inline-flex text-sm text-primary hover:underline"
                    >
                      View review
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
