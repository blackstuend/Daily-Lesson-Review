"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
  const [draggedReview, setDraggedReview] = useState<ReviewWithLesson | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const now = new Date()

  const getReviewColor = (reviewInterval: number, completed: boolean) => {
    if (completed) {
      return "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
    }

    switch (reviewInterval) {
      case 0:
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800"
      case 1:
        return "border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800"
      case 3:
        return "border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800"
      case 7:
        return "border-pink-200 bg-pink-50 dark:bg-pink-950/20 dark:border-pink-800"
      default:
        return "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
    }
  }

  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const endingDayOfWeek = lastDay.getDay()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  // Get days in previous month
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
  const prevMonthDays = startingDayOfWeek
  const nextMonthDays = 6 - endingDayOfWeek

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

  const handleDragStart = (e: React.DragEvent, review: ReviewWithLesson) => {
    setDraggedReview(review)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML)
  }

  const handleDragEnd = () => {
    setDraggedReview(null)
    setDragOverDate(null)
  }

  const handleDragOver = (e: React.DragEvent, dateString: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverDate(dateString)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault()
    setDragOverDate(null)

    if (!draggedReview || draggedReview.review_date === targetDate) {
      setDraggedReview(null)
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/reviews/${draggedReview.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ review_date: targetDate }),
      })

      if (!response.ok) {
        throw new Error("Failed to update review date")
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error updating review date:", error)
      alert("Failed to update review date. Please try again.")
    } finally {
      setIsUpdating(false)
      setDraggedReview(null)
    }
  }

  const handleToggleComplete = async (reviewId: string, completed: boolean) => {
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle completion status")
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error toggling completion:", error)
      alert("Failed to update completion status. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Learning Calendar</h1>
        <p className="text-muted-foreground">
          {isUpdating
            ? "Updating review date..."
            : "Drag and drop cards to reschedule reviews"}
        </p>
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
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="pb-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2 auto-rows-[minmax(150px,1fr)]">
            {/* Previous month days */}
            {Array.from({ length: prevMonthDays }).map((_, index) => {
              const day = prevMonthLastDay - prevMonthDays + index + 1
              const date = new Date(prevYear, prevMonth, day)
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayReviews = reviewsByDate[dateString] ?? []

              return (
                <div
                  key={`prev-${index}`}
                  className={cn(
                    "min-h-[150px] rounded-lg border transition-all relative group/cell opacity-50",
                    "border-border/50",
                    dragOverDate === dateString ? "border-primary border-2 bg-primary/10 shadow-lg opacity-100" : "",
                    "hover:border-primary/50 hover:opacity-75"
                  )}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateString)}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                    <div className="text-sm font-semibold text-muted-foreground">{day}</div>
                    {dayReviews.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium">
                        {dayReviews.length}
                      </Badge>
                    )}
                  </div>

                  {dayReviews.length > 0 ? (
                    <div className="p-2 space-y-1.5 max-h-[calc(150px-32px)] overflow-y-auto overflow-x-hidden scrollbar-thin">
                      {dayReviews.map((review) => {
                        const lessonTitle = review.lessons?.title ?? "Untitled lesson"
                        const isDragging = draggedReview?.id === review.id
                        return (
                          <div
                            key={review.id}
                            draggable={!isUpdating}
                            onDragStart={(e) => handleDragStart(e, review)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "group relative rounded-md border bg-card p-1.5 shadow-sm transition-all cursor-move shrink-0",
                              getReviewColor(review.review_interval, review.completed),
                              isDragging && "opacity-40 scale-95",
                              !isUpdating && "hover:shadow-md hover:scale-[1.02] active:scale-95"
                            )}
                          >
                            <div className="flex items-start gap-1">
                              <Checkbox
                                checked={review.completed}
                                onCheckedChange={() => handleToggleComplete(review.id, review.completed)}
                                className="mt-0.5 h-3 w-3 shrink-0"
                                disabled={isUpdating}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/dashboard/review/${review.id}`}
                                  className="text-[11px] font-medium leading-tight hover:underline line-clamp-2 block"
                                  title={lessonTitle}
                                  onClick={(e) => {
                                    if (isDragging) e.preventDefault()
                                  }}
                                >
                                  {lessonTitle}
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {/* Current month days */}
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
                <div
                  key={day}
                  className={cn(
                    "min-h-[150px] rounded-lg border transition-all relative group/cell",
                    isToday ? "border-primary bg-primary/5" : "border-border",
                    dragOverDate === dateString ? "border-primary border-2 bg-primary/10 shadow-lg" : "",
                    "hover:border-primary/50"
                  )}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateString)}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                    <div className="text-sm font-semibold">{day}</div>
                    {dayReviews.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                        {dayReviews.length}
                      </Badge>
                    )}
                  </div>

                  {dayReviews.length > 0 ? (
                    <div className="p-2 space-y-1.5 max-h-[calc(150px-32px)] overflow-y-auto overflow-x-hidden scrollbar-thin">
                      {dayReviews.map((review) => {
                        const lessonTitle = review.lessons?.title ?? "Untitled lesson"
                        const isDragging = draggedReview?.id === review.id
                        return (
                          <div
                            key={review.id}
                            draggable={!isUpdating}
                            onDragStart={(e) => handleDragStart(e, review)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "group relative rounded-md border bg-card p-1.5 shadow-sm transition-all cursor-move shrink-0",
                              getReviewColor(review.review_interval, review.completed),
                              isDragging && "opacity-40 scale-95",
                              !isUpdating && "hover:shadow-md hover:scale-[1.02] active:scale-95"
                            )}
                          >
                            <div className="flex items-start gap-1">
                              <Checkbox
                                checked={review.completed}
                                onCheckedChange={() => handleToggleComplete(review.id, review.completed)}
                                className="mt-0.5 h-3 w-3 shrink-0"
                                disabled={isUpdating}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/dashboard/review/${review.id}`}
                                  className="text-[11px] font-medium leading-tight hover:underline line-clamp-2 block"
                                  title={lessonTitle}
                                  onClick={(e) => {
                                    if (isDragging) e.preventDefault()
                                  }}
                                >
                                  {lessonTitle}
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {/* Next month days */}
            {Array.from({ length: nextMonthDays }).map((_, index) => {
              const day = index + 1
              const date = new Date(nextYear, nextMonth, day)
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const dayReviews = reviewsByDate[dateString] ?? []

              return (
                <div
                  key={`next-${index}`}
                  className={cn(
                    "min-h-[150px] rounded-lg border transition-all relative group/cell opacity-50",
                    "border-border/50",
                    dragOverDate === dateString ? "border-primary border-2 bg-primary/10 shadow-lg opacity-100" : "",
                    "hover:border-primary/50 hover:opacity-75"
                  )}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateString)}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                    <div className="text-sm font-semibold text-muted-foreground">{day}</div>
                    {dayReviews.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium">
                        {dayReviews.length}
                      </Badge>
                    )}
                  </div>

                  {dayReviews.length > 0 ? (
                    <div className="p-2 space-y-1.5 max-h-[calc(150px-32px)] overflow-y-auto overflow-x-hidden scrollbar-thin">
                      {dayReviews.map((review) => {
                        const lessonTitle = review.lessons?.title ?? "Untitled lesson"
                        const isDragging = draggedReview?.id === review.id
                        return (
                          <div
                            key={review.id}
                            draggable={!isUpdating}
                            onDragStart={(e) => handleDragStart(e, review)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "group relative rounded-md border bg-card p-1.5 shadow-sm transition-all cursor-move shrink-0",
                              getReviewColor(review.review_interval, review.completed),
                              isDragging && "opacity-40 scale-95",
                              !isUpdating && "hover:shadow-md hover:scale-[1.02] active:scale-95"
                            )}
                          >
                            <div className="flex items-start gap-1">
                              <Checkbox
                                checked={review.completed}
                                onCheckedChange={() => handleToggleComplete(review.id, review.completed)}
                                className="mt-0.5 h-3 w-3 shrink-0"
                                disabled={isUpdating}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/dashboard/review/${review.id}`}
                                  className="text-[11px] font-medium leading-tight hover:underline line-clamp-2 block"
                                  title={lessonTitle}
                                  onClick={(e) => {
                                    if (isDragging) e.preventDefault()
                                  }}
                                >
                                  {lessonTitle}
                                </Link>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Day 0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Day 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Day 3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-pink-500" />
              <span className="text-muted-foreground">Day 7</span>
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
                const isDragging = draggedReview?.id === review.id
                return (
                  <div
                    key={review.id}
                    draggable={!isUpdating}
                    onDragStart={(e) => handleDragStart(e, review)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "rounded-lg border p-4 transition-all cursor-move",
                      getReviewColor(review.review_interval, review.completed),
                      isDragging && "opacity-40 scale-95",
                      !isUpdating && "hover:shadow-md hover:scale-[1.01] active:scale-95"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={review.completed}
                        onCheckedChange={() => handleToggleComplete(review.id, review.completed)}
                        className="mt-1 h-4 w-4 shrink-0"
                        disabled={isUpdating}
                      />
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
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
                          onClick={(e) => {
                            if (isDragging) e.preventDefault()
                          }}
                        >
                          View review
                        </Link>
                      </div>
                    </div>
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
