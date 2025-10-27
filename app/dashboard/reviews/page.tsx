import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import { ReviewCard } from "@/components/review-card"

export default async function ReviewsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const today = new Date().toISOString().split("T")[0]

  const { data: todayReviews } = await supabase
    .from("review_schedule")
    .select("*, lessons(*)")
    .eq("review_date", today)
    .order("completed", { ascending: true })
    .order("review_interval", { ascending: true })

  // Get upcoming reviews (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const { data: upcomingReviews } = await supabase
    .from("review_schedule")
    .select("*, lessons(*)")
    .gt("review_date", today)
    .lte("review_date", nextWeek.toISOString().split("T")[0])
    .order("review_date", { ascending: true })

  // Get past reviews
  const { data: pastReviews } = await supabase
    .from("review_schedule")
    .select("*, lessons(*)")
    .lt("review_date", today)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(20)

  const todayPending = todayReviews?.filter((r: any) => !r.completed).length || 0

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
          {todayReviews && todayReviews.length > 0 ? (
            <div className="space-y-3">
              {todayReviews.map((review: any) => (
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
          {upcomingReviews && upcomingReviews.length > 0 ? (
            <div className="space-y-3">
              {upcomingReviews.map((review: any) => (
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
          {pastReviews && pastReviews.length > 0 ? (
            <div className="space-y-3">
              {pastReviews.map((review: any) => (
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
