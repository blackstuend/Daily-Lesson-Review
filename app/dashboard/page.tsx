"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewCard } from "@/components/review-card"
import DashboardLoading from "@/app/dashboard/loading"
import { useDashboardStore } from "@/stores/dashboard-store"
import { BookOpen, Calendar, Plus } from "lucide-react"

export default function DashboardPage() {
  const dashboardData = useDashboardStore((state) => state.dashboardData)
  const isLoadingDashboard = useDashboardStore((state) => state.isLoadingDashboard)
  const dashboardError = useDashboardStore((state) => state.dashboardError)
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)

  useEffect(() => {
    if (!dashboardData) {
      void fetchDashboardData()
    }
  }, [dashboardData, fetchDashboardData])

  if (isLoadingDashboard && !dashboardData) {
    return <DashboardLoading />
  }

  if (dashboardError && !dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            <p>{dashboardError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingCount = dashboardData?.pendingCount ?? 0
  const totalLessons = dashboardData?.totalLessons ?? 0
  const todayReviews = dashboardData?.todayReviews ?? []

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

      <Card>
        <CardHeader>
          <CardTitle>Review Schedule</CardTitle>
          <CardDescription>Complete these reviews to maintain your learning streak</CardDescription>
        </CardHeader>
        <CardContent>
          {todayReviews.length > 0 ? (
            <div className="space-y-3">
              {todayReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No reviews scheduled for today. Great job staying on track!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
