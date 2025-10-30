"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ActivityCalendar from "react-activity-calendar"
import type { ContributionsData } from "@/lib/contributions"

interface ContributionsGraphProps {
  data: ContributionsData
}

export function ContributionsGraph({ data }: ContributionsGraphProps) {
  if (data.contributions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Graph</CardTitle>
        <CardDescription>
          Your review completion activity over the past year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">{data.totalContributions} reviews</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current streak: </span>
              <span className="font-semibold">{data.currentStreak} days</span>
            </div>
            <div>
              <span className="text-muted-foreground">Longest streak: </span>
              <span className="font-semibold">{data.longestStreak} days</span>
            </div>
          </div>

          {/* Graph */}
          <ActivityCalendar
            data={data.contributions}
            theme={{
              light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
              dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
            }}
            labels={{
              totalCount: "{{count}} reviews in the last year",
            }}
            showWeekdayLabels
            blockSize={11}
            blockMargin={3}
            fontSize={12}
          />
        </div>
      </CardContent>
    </Card>
  )
}
