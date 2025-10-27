import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const now = new Date()
  const currentMonth = searchParams.month ? Number.parseInt(searchParams.month) : now.getMonth()
  const currentYear = searchParams.year ? Number.parseInt(searchParams.year) : now.getFullYear()

  // Get first and last day of the month
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)

  // Get all reviews for this month
  const { data: reviews } = await supabase
    .from("review_schedule")
    .select("*, lessons(*)")
    .gte("review_date", firstDay.toISOString().split("T")[0])
    .lte("review_date", lastDay.toISOString().split("T")[0])

  // Group reviews by date
  const reviewsByDate: Record<string, any[]> = {}
  reviews?.forEach((review) => {
    const date = review.review_date
    if (!reviewsByDate[date]) {
      reviewsByDate[date] = []
    }
    reviewsByDate[date].push(review)
  })

  // Calculate calendar grid
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

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

            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(currentYear, currentMonth, day)
              const dateString = date.toISOString().split("T")[0]
              const dayReviews = reviewsByDate[dateString] || []
              const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()

              const completedCount = dayReviews.filter((r) => r.completed).length
              const totalCount = dayReviews.length

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-2 ${
                    isToday ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-1 text-sm font-medium">{day}</div>
                    {totalCount > 0 && (
                      <div className="mt-auto space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {completedCount}/{totalCount}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {dayReviews.slice(0, 3).map((review) => (
                            <div
                              key={review.id}
                              className={`h-1.5 w-1.5 rounded-full ${
                                review.completed ? "bg-green-500" : "bg-yellow-500"
                              }`}
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
              <span className="font-medium">{reviews?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium text-green-600">{reviews?.filter((r) => r.completed).length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-medium text-yellow-600">{reviews?.filter((r) => !r.completed).length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Intervals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[0, 1, 3, 7].map((interval) => {
              const count = reviews?.filter((r) => r.review_interval === interval).length || 0
              return (
                <div key={interval} className="flex justify-between">
                  <span className="text-muted-foreground">Day {interval}:</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
