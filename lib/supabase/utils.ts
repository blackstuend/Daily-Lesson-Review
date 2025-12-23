/**
 * Fetches all data from a Supabase query, handling the 1000 row limit by paginating.
 * 
 * @param queryBuilder - A function that returns the Supabase query builder (without .range())
 * @param pageSize - Number of rows to fetch per request (default: 1000)
 * @returns Promise with all data combined from all pages
 * 
 * @example
 * const allReviews = await fetchAllPaginated<ReviewWithLesson>(() =>
 *   supabase
 *     .from("review_schedule")
 *     .select("*")
 *     .gte("review_date", startDate)
 *     .lte("review_date", endDate)
 * )
 */
export async function fetchAllPaginated<T>(
  queryBuilder: () => {
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
  },
  pageSize: number = 1000
): Promise<T[]> {
  let offset = 0
  let allData: T[] = []

  while (true) {
    const result = await queryBuilder().range(offset, offset + pageSize - 1)
    const { data, error } = result

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.length === 0) {
      break
    }

    allData = allData.concat(data)

    // If we got fewer rows than the page size, we've reached the end
    if (data.length < pageSize) {
      break
    }

    offset += pageSize
  }

  return allData
}
