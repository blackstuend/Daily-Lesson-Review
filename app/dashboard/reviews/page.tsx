import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewCard } from "@/components/review-card"
import { getReviewsData } from "@/lib/dashboard"
import { groupReviewsByLinkedResource } from "@/lib/review-grouping"

export default async function ReviewsPage() {
  const reviewsData = await getReviewsData()

  const todayReviews = reviewsData.today
  const upcomingReviews = reviewsData.upcoming

  const groupedToday = groupReviewsByLinkedResource(todayReviews)
  const groupedUpcoming = groupReviewsByLinkedResource(upcomingReviews)

  const todayPending = groupedToday.displayReviews.filter((review) => !review.completed).length

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
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {groupedToday.displayReviews.length > 0 ? (
            <div className="space-y-3">
              {groupedToday.displayReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showTodoStyle
                  linkedChildren={groupedToday.childrenByParentId[review.id]}
                />
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
          {groupedUpcoming.displayReviews.length > 0 ? (
            <div className="space-y-3">
              {groupedUpcoming.displayReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showDate
                  linkedChildren={groupedUpcoming.childrenByParentId[review.id]}
                />
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
      </Tabs>
    </div>
  )
}
