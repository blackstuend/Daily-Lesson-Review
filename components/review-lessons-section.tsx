"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReviewCard } from "@/components/review-card"

interface ReviewLessonsSectionProps {
  reviews: any[]
  linkedChildrenMap?: Record<string, any[]>
}

export function ReviewLessonsSection({ reviews, linkedChildrenMap = {} }: ReviewLessonsSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number | "all">("all")
  const [selectedType, setSelectedType] = useState<string>("all")

  const allChildren = Object.values(linkedChildrenMap)
  const totalChildren = allChildren.reduce((sum, list) => sum + (list?.length ?? 0), 0)
  const totalItemsCount = reviews.length + totalChildren

  const dayCounts = {
    0: 0,
    1: 0,
    3: 0,
    7: 0,
  }

  const typeCounts = {
    word: 0,
    sentence: 0,
    link: 0,
  }

  const incrementCounts = (reviewList: any[]) => {
    reviewList.forEach((review) => {
      const interval = review.review_interval as 0 | 1 | 3 | 7
      if (interval in dayCounts) {
        dayCounts[interval] += 1
      }
      const type = review.lessons?.lesson_type as keyof typeof typeCounts
      if (type && typeCounts[type] !== undefined) {
        typeCounts[type] += 1
      }
    })
  }

  incrementCounts(reviews)
  allChildren.forEach((list) => incrementCounts(list ?? []))

  const matchesDayFilter = (review: any) => {
    if (selectedDay === "all") return true
    if (review.review_interval === selectedDay) return true
    const children = linkedChildrenMap[review.id] ?? []
    return children.some((child: any) => child.review_interval === selectedDay)
  }

  const matchesTypeFilter = (review: any) => {
    if (selectedType === "all") return true
    if (review.lessons?.lesson_type === selectedType) return true
    const children = linkedChildrenMap[review.id] ?? []
    return children.some((child: any) => child.lessons?.lesson_type === selectedType)
  }

  const filteredReviews = reviews.filter((review) => matchesDayFilter(review) && matchesTypeFilter(review))

  const getFilteredChildrenForReview = (review: any) => {
    const children = linkedChildrenMap[review.id] ?? []
    return children.filter((child: any) => {
      const matchesDay = selectedDay === "all" || child.review_interval === selectedDay
      const matchesType = selectedType === "all" || child.lessons?.lesson_type === selectedType
      return matchesDay && matchesType
    })
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Today&apos;s Review Lessons</CardTitle>
        <CardDescription>Linked lesson cards include their related words and sentences so everything stays together.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Filter by type</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select lesson type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({totalItemsCount})</SelectItem>
              <SelectItem value="word">Vocabulary ({typeCounts.word})</SelectItem>
              <SelectItem value="sentence">Sentence ({typeCounts.sentence})</SelectItem>
              <SelectItem value="link">Link ({typeCounts.link})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={String(selectedDay)} onValueChange={(value) => setSelectedDay(value === "all" ? "all" : Number(value))} className="mb-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({totalItemsCount})</TabsTrigger>
            <TabsTrigger value="0">Day 0 ({dayCounts[0]})</TabsTrigger>
            <TabsTrigger value="1">Day 1 ({dayCounts[1]})</TabsTrigger>
            <TabsTrigger value="3">Day 3 ({dayCounts[3]})</TabsTrigger>
            <TabsTrigger value="7">Day 7 ({dayCounts[7]})</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredReviews.length > 0 ? (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showTodoStyle
                hideBadgesWhenCompleted
                linkedChildren={getFilteredChildrenForReview(review)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>
              No {selectedType !== "all" ? `${selectedType} ` : ""}lessons for {selectedDay === "all" ? "today" : `Day ${selectedDay}`}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
