import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewLessonsSection } from "@/components/review-lessons-section"
import { getCalendarDayData } from "@/lib/dashboard"
import { groupReviewsByLinkedResource } from "@/lib/review-grouping"

type CalendarDayParams = Promise<{ date: string }>

function isValidDateParam(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

export default async function CalendarDayPage({ params }: { params: CalendarDayParams }) {
  const { date } = await params

  if (!isValidDateParam(date)) {
    notFound()
  }

  const dateInstance = new Date(`${date}T00:00:00`)
  if (Number.isNaN(dateInstance.getTime())) {
    notFound()
  }

  const reviews = await getCalendarDayData(date)
  const grouped = groupReviewsByLinkedResource(reviews)
  const formattedDate = dateInstance.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const monthLink = `/dashboard/calendar?month=${dateInstance.getMonth()}&year=${dateInstance.getFullYear()}`

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Calendar overview</p>
          <h1 className="text-3xl font-bold">Reviews for {formattedDate}</h1>
          <p className="text-muted-foreground">All lessons scheduled for this day.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={monthLink} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to calendar
          </Link>
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reviews due</CardTitle>
            <CardDescription>You have nothing scheduled for this date.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Continue adding lessons or adjust your schedule to see them appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReviewLessonsSection
          reviews={grouped.displayReviews}
          linkedChildrenMap={grouped.childrenByParentId}
          title={`Review lessons for ${formattedDate}`}
          description={`Linked lesson cards include their related items so you can review everything scheduled for ${formattedDate}.`}
          dayLabel={formattedDate}
        />
      )}
    </div>
  )
}
