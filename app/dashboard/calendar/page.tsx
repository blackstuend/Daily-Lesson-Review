import { getCalendarData } from "@/lib/dashboard"
import { CalendarView } from "@/components/calendar-view"

type SearchParams = Promise<{
  month?: string
  year?: string
}>

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const now = new Date()

  const currentMonth = params.month ? Number.parseInt(params.month) : now.getMonth()
  const currentYear = params.year ? Number.parseInt(params.year) : now.getFullYear()

  const reviews = await getCalendarData(currentMonth, currentYear)

  return <CalendarView reviews={reviews} currentMonth={currentMonth} currentYear={currentYear} />
}
