"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewCard } from "@/components/review-card"

interface ReviewLessonsSectionProps {
  reviews: any[]
}

export function ReviewLessonsSection({ reviews }: ReviewLessonsSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number | "all">("all")

  // Filter reviews based on selected day
  const filteredReviews = selectedDay === "all"
    ? reviews
    : reviews.filter((review) => review.review_interval === selectedDay)

  // Count reviews for each interval
  const dayCounts = {
    0: reviews.filter((r) => r.review_interval === 0).length,
    1: reviews.filter((r) => r.review_interval === 1).length,
    3: reviews.filter((r) => r.review_interval === 3).length,
    7: reviews.filter((r) => r.review_interval === 7).length,
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Today&apos;s Review Lessons</CardTitle>
        <CardDescription>Review and track your lessons for today</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={String(selectedDay)} onValueChange={(value) => setSelectedDay(value === "all" ? "all" : Number(value))} className="mb-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
            <TabsTrigger value="0">Day 0 ({dayCounts[0]})</TabsTrigger>
            <TabsTrigger value="1">Day 1 ({dayCounts[1]})</TabsTrigger>
            <TabsTrigger value="3">Day 3 ({dayCounts[3]})</TabsTrigger>
            <TabsTrigger value="7">Day 7 ({dayCounts[7]})</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredReviews.length > 0 ? (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} showTodoStyle hideBadgesWhenCompleted />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No lessons for {selectedDay === "all" ? "today" : `Day ${selectedDay}`}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
