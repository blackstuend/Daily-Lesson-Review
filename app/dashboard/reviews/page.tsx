"use client"

import { useEffect, useMemo } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewCard } from "@/components/review-card"
import { useDashboardStore } from "@/stores/dashboard-store"

export default function ReviewsPage() {
  const reviewsData = useDashboardStore((state) => state.reviewsData)
  const isLoadingReviews = useDashboardStore((state) => state.isLoadingReviews)
  const reviewsError = useDashboardStore((state) => state.reviewsError)
  const fetchReviewsData = useDashboardStore((state) => state.fetchReviewsData)

  useEffect(() => {
    if (!reviewsData) {
      void fetchReviewsData()
    }
  }, [reviewsData, fetchReviewsData])

  const todayPending = useMemo(() => {
    return (reviewsData?.today ?? []).filter((review) => !review.completed).length
  }, [reviewsData])

  if (reviewsError && !reviewsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            <p>{reviewsError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reviewsData && isLoadingReviews) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-10 w-56 animate-pulse rounded bg-accent" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-accent" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-dashed">
              <CardContent className="space-y-3 py-6">
                <div className="h-6 w-32 animate-pulse rounded bg-accent" />
                <div className="h-4 w-full animate-pulse rounded bg-accent" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-accent" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const todayReviews = reviewsData?.today ?? []
  const upcomingReviews = reviewsData?.upcoming ?? []
  const pastReviews = reviewsData?.past ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Review Schedule</h1>
        <p className="text-muted-foreground">Manage your spaced repetition reviews</p>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">
            Today{" "}
            {todayPending > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {todayPending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayReviews.length > 0 ? (
            <div className="space-y-3">
              {todayReviews.map((review) => (
                <ReviewCard key={review.id} review={review} showTodoStyle />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No reviews scheduled for today</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingReviews.length > 0 ? (
            <div className="space-y-3">
              {upcomingReviews.map((review) => (
                <ReviewCard key={review.id} review={review} showDate />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No upcoming reviews in the next 7 days</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {pastReviews.length > 0 ? (
            <div className="space-y-3">
              {pastReviews.map((review) => (
                <ReviewCard key={review.id} review={review} showDate />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No completed reviews yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
