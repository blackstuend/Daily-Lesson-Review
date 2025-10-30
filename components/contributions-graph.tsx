"use client"

import { useState } from "react"
import { format, getDay, startOfWeek, addWeeks, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ContributionsData } from "@/lib/contributions"

interface ContributionsGraphProps {
  data: ContributionsData
}

export function ContributionsGraph({ data }: ContributionsGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Group contributions by weeks
  const weeks: Array<Array<typeof data.contributions[0]>> = []
  let currentWeek: Array<typeof data.contributions[0]> = []

  // Start from the first contribution and organize by weeks
  const startDate = data.contributions[0] ? parseISO(data.contributions[0].date) : new Date()
  let weekStart = startOfWeek(startDate, { weekStartsOn: 0 }) // Sunday

  data.contributions.forEach((contrib) => {
    const contribDate = parseISO(contrib.date)
    const contribWeekStart = startOfWeek(contribDate, { weekStartsOn: 0 })

    // If we've moved to a new week, push current week and start new one
    if (contribWeekStart.getTime() !== weekStart.getTime()) {
      weeks.push([...currentWeek])
      currentWeek = []
      weekStart = contribWeekStart
    }

    currentWeek.push(contrib)
  })

  // Push the last week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const getLevelColor = (level: number): string => {
    const colors = {
      0: "bg-muted",
      1: "bg-green-200 dark:bg-green-900",
      2: "bg-green-400 dark:bg-green-700",
      3: "bg-green-600 dark:bg-green-500",
      4: "bg-green-800 dark:bg-green-400",
    }
    return colors[level as keyof typeof colors] || colors[0]
  }

  const monthLabels: Array<{ label: string; weekIndex: number }> = []
  let lastMonth = ""

  weeks.forEach((week, weekIndex) => {
    if (week.length > 0) {
      const firstDayOfWeek = week[0]
      const month = format(parseISO(firstDayOfWeek.date), "MMM")

      if (month !== lastMonth) {
        monthLabels.push({ label: month, weekIndex })
        lastMonth = month
      }
    }
  })

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
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Month labels */}
              <div className="mb-1 flex gap-[3px]" style={{ paddingLeft: "28px" }}>
                {monthLabels.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft: idx === 0 ? 0 : `${(item.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 14}px`,
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Day labels and grid */}
              <div className="flex gap-[3px]">
                {/* Day of week labels */}
                <div className="flex flex-col gap-[3px] pr-2">
                  <div className="h-[11px]"></div> {/* Mon */}
                  <div className="h-[11px] text-xs text-muted-foreground">Mon</div>
                  <div className="h-[11px]"></div> {/* Wed */}
                  <div className="h-[11px] text-xs text-muted-foreground">Wed</div>
                  <div className="h-[11px]"></div> {/* Fri */}
                  <div className="h-[11px] text-xs text-muted-foreground">Fri</div>
                  <div className="h-[11px]"></div> {/* Sun */}
                </div>

                {/* Contribution grid */}
                <TooltipProvider delayDuration={0}>
                  <div className="flex gap-[3px]">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-[3px]">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                          const contrib = week.find((c) => getDay(parseISO(c.date)) === dayOfWeek)

                          if (!contrib) {
                            return <div key={dayOfWeek} className="h-[11px] w-[11px]"></div>
                          }

                          return (
                            <Tooltip key={dayOfWeek}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`h-[11px] w-[11px] rounded-sm transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1 ${getLevelColor(contrib.level)}`}
                                  onMouseEnter={() => setHoveredDay(contrib.date)}
                                  onMouseLeave={() => setHoveredDay(null)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">
                                  {contrib.count} {contrib.count === 1 ? "review" : "reviews"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(contrib.date), "MMM d, yyyy")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-[11px] w-[11px] rounded-sm ${getLevelColor(level)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
