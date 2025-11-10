type Review = {
  id: string
  review_date: string
  lessons?: {
    id: string
    lesson_type: string
    linked_lesson_id?: string | null
  }
  [key: string]: any
}

type GroupedReviewsResult = {
  displayReviews: Review[]
  childrenByParentId: Record<string, Review[]>
}

/**
 * Groups word/sentence reviews under their linked link-lesson review when both are due on the same day.
 */
export function groupReviewsByLinkedResource(reviews: Review[]): GroupedReviewsResult {
  const linkReviewByKey = new Map<string, Review>()
  const childrenByParentId: Record<string, Review[]> = {}
  const hiddenChildIds = new Set<string>()

  for (const review of reviews) {
    const lessonId = review.lessons?.id
    if (!lessonId) continue
    if (review.lessons?.lesson_type !== "link") continue
    const key = `${lessonId}:${review.review_date}`
    linkReviewByKey.set(key, review)
  }

  for (const review of reviews) {
    const parentLessonId = review.lessons?.linked_lesson_id
    if (!parentLessonId) continue
    const parentKey = `${parentLessonId}:${review.review_date}`
    const parentReview = linkReviewByKey.get(parentKey)
    if (!parentReview) continue

    if (!childrenByParentId[parentReview.id]) {
      childrenByParentId[parentReview.id] = []
    }
    childrenByParentId[parentReview.id].push(review)
    hiddenChildIds.add(review.id)
  }

  const displayReviews = reviews.filter((review) => !hiddenChildIds.has(review.id))

  return {
    displayReviews,
    childrenByParentId,
  }
}
