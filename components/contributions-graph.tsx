"use client"

import { useState } from "react"
import { format, startOfWeek, parseISO } from "date-fns"
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

  // Create a map for quick lookup
  const contributionMap = new Map(data.contributions.map((c) => [c.date, c]))

  // Group contributions by weeks starting from the first date
  const weeks: Array<Array<typeof data.contributions[0] | null>> = []

  if (data.contributions.length === 0) {
    return null
  }

  const startDate = parseISO(data.contributions[0].date)
  const endDate = parseISO(data.contributions[data.contributions.length - 1].date)

  // Start from the Sunday of the week containing the first contribution
  let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 0 })
  const lastWeekStart = startOfWeek(endDate, { weekStartsOn: 0 })

  // Build weeks array
  while (currentWeekStart <= lastWeekStart) {
    const week: Array<typeof data.contributions[0] | null> = []

    // For each day of the week (Sunday = 0 to Saturday = 6)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(currentWeekStart)
      currentDate.setDate(currentDate.getDate() + dayOffset)
      const dateStr = format(currentDate, "yyyy-MM-dd")

      const contribution = contributionMap.get(dateStr)
      week.push(contribution || null)
    }

    weeks.push(week)

    // Move to next week
    currentWeekStart = new Date(currentWeekStart)
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
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

  // Generate month labels - use the first Sunday of each week to determine month
  const monthLabels: Array<{ label: string; weekIndex: number }> = []
  let lastMonth = ""

  weeks.forEach((week, weekIndex) => {
    // Use the first day (Sunday) of the week to determine the month
    const firstDayOfWeek = week[0]
    if (firstDayOfWeek) {
      const month = format(parseISO(firstDayOfWeek.date), "MMM")

      if (month !== lastMonth && weekIndex > 0) {
        monthLabels.push({ label: month, weekIndex })
        lastMonth = month
      } else if (weekIndex === 0) {
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
                        {week.map((contrib, dayIndex) => {
                          if (!contrib) {
                            return <div key={dayIndex} className="h-[11px] w-[11px]"></div>
                          }

                          return (
                            <Tooltip key={dayIndex}>
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
