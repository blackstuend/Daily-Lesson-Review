import { cache } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { handleSessionError } from "@/lib/auth-error-handler"
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns"

export type ContributionDay = {
  date: string // YYYY-MM-DD
  count: number
  level: 0 | 1 | 2 | 3 | 4 // GitHub-style levels for intensity
}

export type ContributionsData = {
  contributions: ContributionDay[]
  totalContributions: number
  currentStreak: number
  longestStreak: number
}

function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

function calculateStreaks(contributions: ContributionDay[]): { currentStreak: number; longestStreak: number } {
  if (contributions.length === 0) return { currentStreak: 0, longestStreak: 0 }

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Sort by date descending to check current streak
  const sortedContributions = [...contributions].sort((a, b) => b.date.localeCompare(a.date))

  // Calculate current streak (from today backwards)
  const today = format(startOfDay(new Date()), "yyyy-MM-dd")
  let checkDate = today

  for (const contrib of sortedContributions) {
    if (contrib.date === checkDate && contrib.count > 0) {
      currentStreak++
      const prevDay = format(subDays(new Date(checkDate), 1), "yyyy-MM-dd")
      checkDate = prevDay
    } else if (contrib.date < checkDate) {
      break
    }
  }

  // Calculate longest streak
  for (const contrib of contributions) {
    if (contrib.count > 0) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  return { currentStreak, longestStreak }
}

export const getContributionsData = cache(async (): Promise<ContributionsData> => {
  try {
    const supabase = await getSupabaseServerClient()
    const today = startOfDay(new Date())
    const startDate = subDays(today, 364) // Get last 365 days (including today)

    // Fetch all completed reviews from the past year
    const { data, error } = await supabase
      .from("review_schedule")
      .select("completed_at")
      .eq("completed", true)
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true })

    if (error) {
      handleSessionError(error)
      throw new Error(`Failed to fetch contributions data: ${error.message}`)
    }

    // Create a map of date -> count
    const contributionMap: Record<string, number> = {}

    // Group completions by date
    ;(data ?? []).forEach((item) => {
      if (item.completed_at) {
        const date = format(startOfDay(new Date(item.completed_at)), "yyyy-MM-dd")
        contributionMap[date] = (contributionMap[date] || 0) + 1
      }
    })

    // Generate all days in the past year
    const allDays = eachDayOfInterval({
      start: startDate,
      end: today,
    })

    // Create contribution array with all days
    const contributions: ContributionDay[] = allDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const count = contributionMap[dateStr] || 0
      return {
        date: dateStr,
        count,
        level: getContributionLevel(count),
      }
    })

    const totalContributions = Object.values(contributionMap).reduce((sum, count) => sum + count, 0)
    const { currentStreak, longestStreak } = calculateStreaks(contributions)

    return {
      contributions,
      totalContributions,
      currentStreak,
      longestStreak,
    }
  } catch (error) {
    handleSessionError(error)
    throw error
  }
})
