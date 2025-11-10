"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, GripVertical, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { groupReviewsByLinkedResource } from "@/lib/review-grouping"
import { toast } from "@/hooks/use-toast"

type ReviewWithLesson = {
  id: string
  review_date: string
  completed: boolean
  completed_at: string | null
  review_interval: number
  lessons: any
  [key: string]: any
}

type CompletionState = Pick<ReviewWithLesson, "completed" | "completed_at">

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
  const [draggedReview, setDraggedReview] = useState<ReviewWithLesson | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [completionOverrides, setCompletionOverrides] = useState<Record<string, CompletionState>>({})
  const [pendingToggleIds, setPendingToggleIds] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const now = new Date()

  const baseCompletionState = useMemo(() => {
    const map: Record<string, CompletionState> = {}
    reviews.forEach((review) => {
      map[review.id] = {
        completed: review.completed,
        completed_at: review.completed_at,
      }
    })
    return map
  }, [reviews])

  const resolvedReviews = useMemo(() => {
    return reviews.map((review) => {
      const override = completionOverrides[review.id]
      if (!override) return review
      return {
        ...review,
        ...override,
      }
    })
  }, [reviews, completionOverrides])

  useEffect(() => {
    setCompletionOverrides((prev) => {
      let changed = false
      const next = { ...prev }
      Object.entries(prev).forEach(([id, state]) => {
        const base = baseCompletionState[id]
        if (base && base.completed === state.completed && base.completed_at === state.completed_at) {
          delete next[id]
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [baseCompletionState])

  const applyOverride = (reviewId: string, state: CompletionState | null) => {
    setCompletionOverrides((prev) => {
      const next = { ...prev }
      if (state === null) {
        delete next[reviewId]
        return next
      }
      const base = baseCompletionState[reviewId]
      if (base && base.completed === state.completed && base.completed_at === state.completed_at) {
        delete next[reviewId]
      } else {
        next[reviewId] = state
      }
      return next
    })
  }

  const setPendingToggle = (reviewId: string, pending: boolean) => {
    setPendingToggleIds((prev) => {
      const next = { ...prev }
      if (pending) {
        next[reviewId] = true
      } else {
        delete next[reviewId]
      }
      return next
    })
  }

  const isReviewPending = (reviewId: string) => Boolean(pendingToggleIds[reviewId])

  const getReviewColor = (reviewInterval: number, completed: boolean) => {
    if (completed) {
      return "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
    }

    switch (reviewInterval) {
      case 0:
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800"
      case 1:
        return "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
      case 3:
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800"
      case 7:
        return "border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800"
      default:
        return "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
    }
  }

  const isAllDayLessonsCompleted = (dayReviews: ReviewWithLesson[]) => {
    return dayReviews.length > 0 && dayReviews.every((review) => review.completed)
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

  const { reviewsByDate, groupedByDate } = useMemo(() => {
    const reviewMap = resolvedReviews.reduce<Record<string, ReviewWithLesson[]>>((acc, review) => {
      const date = review.review_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(review)
      return acc
    }, {})

    const groupedMap: Record<string, ReturnType<typeof groupReviewsByLinkedResource>> = {}
    Object.entries(reviewMap).forEach(([date, list]) => {
      groupedMap[date] = groupReviewsByLinkedResource(list)
    })

    return { reviewsByDate: reviewMap, groupedByDate: groupedMap }
  }, [resolvedReviews])

  const completedCount = resolvedReviews.filter((review) => review.completed).length
  const pendingCount = resolvedReviews.length - completedCount
  const navigateToDate = (dateString: string) => {
    if (draggedReview) return
    router.push(`/dashboard/calendar/${dateString}`)
  }

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

  const handleToggleComplete = async (review: ReviewWithLesson) => {
    const currentState: CompletionState = {
      completed: review.completed,
      completed_at: review.completed_at,
    }
    const nextState: CompletionState = {
      completed: !review.completed,
      completed_at: !review.completed ? new Date().toISOString() : null,
    }

    applyOverride(review.id, nextState)
    setPendingToggle(review.id, true)

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextState),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle completion status")
      }
    } catch (error) {
      console.error("Error toggling completion:", error)
      applyOverride(review.id, currentState)
      toast({
        title: "Couldn't update review",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setPendingToggle(review.id, false)
    }
  }

  const renderCompactReview = (
    review: ReviewWithLesson,
    childReviews: ReviewWithLesson[] = [],
    isChild = false
  ) => {
    const lessonTitle = review.lessons?.title ?? "Untitled lesson"
    const isDragging = draggedReview?.id === review.id

    return (
      <div
        key={review.id}
        draggable={!isUpdating}
        onDragStart={(e) => handleDragStart(e, review)}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "group relative rounded-md border bg-card p-1.5 shadow-sm transition-all cursor-move shrink-0",
          getReviewColor(review.review_interval, review.completed),
          isDragging && "opacity-40 scale-95",
          !isUpdating && "hover:shadow-md hover:scale-[1.02] active:scale-95",
          isChild && "border-dashed bg-muted/70 pl-2 pr-2"
        )}
      >
        <div className="flex items-start gap-1.5">
          <Checkbox
            checked={review.completed}
            onCheckedChange={() => handleToggleComplete(review)}
            className={cn("mt-0.5 shrink-0", isChild ? "size-4" : "size-5")}
            disabled={isUpdating || isReviewPending(review.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={review.completed ? "Mark review incomplete" : "Mark review complete"}
          />
          <GripVertical
            className={cn(
              "text-muted-foreground mt-0.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100",
              isChild ? "h-3 w-3" : "h-4 w-4"
            )}
          />
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/review/${review.id}`}
              className={cn(
                "font-medium leading-tight hover:underline block",
                isChild ? "text-[10px]" : "text-[11px]"
              )}
              title={lessonTitle}
              onClick={(e) => {
                e.stopPropagation()
                if (isDragging) e.preventDefault()
              }}
            >
              {lessonTitle}
            </Link>
          </div>
        </div>
        {!isChild && childReviews.length > 0 && (
          <div className="mt-1.5 space-y-1 border-l border-dashed border-border/60 pl-2">
            {childReviews.map((child) => renderCompactReview(child, [], true))}
          </div>
        )}
      </div>
    )
  }

  const renderDayReviewList = (dateString: string, dayReviews: ReviewWithLesson[]) => {
    if (dayReviews.length === 0) return null
    const grouping = groupedByDate[dateString]
    const displayReviews = grouping?.displayReviews ?? dayReviews
    const childrenMap = grouping?.childrenByParentId ?? {}

    return (
      <div
        className="p-2 space-y-1.5 max-h-[calc(150px-32px)] overflow-y-auto overflow-x-hidden scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {displayReviews.map((review) => renderCompactReview(review, childrenMap[review.id] ?? []))}
      </div>
    )
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
                    "min-h-[150px] rounded-xl border-2 transition-all duration-200 relative group/cell opacity-50 overflow-hidden cursor-pointer",
                    "border-border/30",
                    dragOverDate === dateString
                      ? "!border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20 ring-offset-1 opacity-100"
                      : "",
                    "hover:border-primary/40 hover:opacity-75 hover:shadow-md hover:bg-muted/20"
                  )}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateString)}
                  onClick={() => navigateToDate(dateString)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      navigateToDate(dateString)
                    }
                  }}
                  aria-label={`View schedule for ${date.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}`}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                    <div className="text-sm font-semibold text-muted-foreground">{day}</div>
                    <div className="flex items-center gap-1">
                      {isAllDayLessonsCompleted(dayReviews) && (
                        <Badge variant="default" className="text-[10px] h-4 px-1.5 font-medium bg-emerald-500 hover:bg-emerald-600 gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                      {dayReviews.length > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium">
                          {dayReviews.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {renderDayReviewList(dateString, dayReviews)}
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
                    "min-h-[150px] rounded-xl border-2 transition-all duration-200 relative group/cell overflow-hidden cursor-pointer",
                    isToday
                      ? "border-primary/60 bg-primary/5 shadow-md ring-2 ring-primary/10 ring-offset-1"
                      : "border-border/50",
                    dragOverDate === dateString
                      ? "!border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20 ring-offset-1"
                      : "",
                    "hover:border-primary/60 hover:shadow-md hover:bg-muted/30 hover:scale-[1.01]"
                  )}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateString)}
                  onClick={() => navigateToDate(dateString)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      navigateToDate(dateString)
                    }
                  }}
                  aria-label={`View schedule for ${date.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}`}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                    <div className="text-sm font-semibold">{day}</div>
                    <div className="flex items-center gap-1">
                      {isAllDayLessonsCompleted(dayReviews) && (
                        <Badge variant="default" className="text-[10px] h-4 px-1.5 font-medium bg-emerald-500 hover:bg-emerald-600 gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                      {dayReviews.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                          {dayReviews.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {renderDayReviewList(dateString, dayReviews)}
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
                    "min-h-[150px] rounded-xl border-2 transition-all duration-200 relative group/cell opacity-50 overflow-hidden cursor-pointer",
                    "border-border/30",
                    dragOverDate === dateString
                      ? "!border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20 ring-offset-1 opacity-100"
                      : "",
                    "hover:border-primary/40 hover:opacity-75 hover:shadow-md hover:bg-muted/20"
                  )}
                  onDragOver={(e) => handleDragOver(e, dateString)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dateString)}
                  onClick={() => navigateToDate(dateString)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      navigateToDate(dateString)
                    }
                  }}
                  aria-label={`View schedule for ${date.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}`}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
                    <div className="text-sm font-semibold text-muted-foreground">{day}</div>
                    <div className="flex items-center gap-1">
                      {isAllDayLessonsCompleted(dayReviews) && (
                        <Badge variant="default" className="text-[10px] h-4 px-1.5 font-medium bg-emerald-500 hover:bg-emerald-600 gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                      {dayReviews.length > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium">
                          {dayReviews.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {renderDayReviewList(dateString, dayReviews)}
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
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Day 1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Day 3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Day 7</span>
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
              <span className="font-medium">{resolvedReviews.length}</span>
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
              const count = resolvedReviews.filter((review) => review.review_interval === interval).length
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
