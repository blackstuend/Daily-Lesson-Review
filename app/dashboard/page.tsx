import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewLessonsSection } from "@/components/review-lessons-section"
import { ContributionsGraph } from "@/components/contributions-graph"
import { getDashboardData } from "@/lib/dashboard"
import { getContributionsData } from "@/lib/contributions"
import { BookOpen, Calendar, Plus } from "lucide-react"

export default async function DashboardPage() {
  const [dashboardData, contributionsData] = await Promise.all([
    getDashboardData(),
    getContributionsData(),
  ])

  const totalLessons = dashboardData.totalLessons
  const todayReviews = dashboardData.todayReviews
  const pendingCount = todayReviews.filter((review) => !review.completed).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Here&apos;s your learning overview for today</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Reviews</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Lessons to review today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons}</div>
            <p className="text-xs text-muted-foreground">Lessons in your library</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/add">Add New Lesson</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <ReviewLessonsSection reviews={todayReviews} />

      <ContributionsGraph data={contributionsData} />
    </div>
  )
}
