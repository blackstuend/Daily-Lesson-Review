"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ActivityCalendar from "react-activity-calendar"
import type { ContributionsData } from "@/lib/contributions"
import { useDomTheme } from "@/hooks/use-dom-theme"

interface ContributionsGraphProps {
  data: ContributionsData
}

export function ContributionsGraph({ data }: ContributionsGraphProps) {

  const theme = useDomTheme()
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
          <div className="w-full overflow-x-auto flex justify-center">
            <ActivityCalendar
              colorScheme={theme ?? undefined}
              data={data.contributions}
              labels={{
                totalCount: "{{count}} reviews in the last year",
              }}
              theme={{
                "light": [
                  "hsl(0, 0%, 92%)",
                  "rebeccapurple"
                ],
                "dark": [
                  "hsl(0, 0%, 22%)",
                  "hsl(225,92%,77%)"
                ]
              }}
              showWeekdayLabels
              blockSize={11}
              blockMargin={3}
              fontSize={12}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
