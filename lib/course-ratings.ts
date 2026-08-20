import { supabase } from '@/lib/supabase'

export interface CourseRatingSummary {
  average: number
  count: number
}

export async function getCourseRatingSummaries(courseIds: string[]) {
  const summaries: Record<string, CourseRatingSummary> = {}

  if (courseIds.length === 0) {
    return { summaries, error: null }
  }

  const { data, error } = await supabase
    .from('course_ratings')
    .select('course_id, rating')
    .in('course_id', courseIds)

  if (error) {
    console.error('[v0] Failed to load course ratings:', error.message)
    return { summaries, error }
  }

  for (const item of data || []) {
    const current = summaries[item.course_id] || { average: 0, count: 0 }
    current.average = (current.average * current.count + item.rating) / (current.count + 1)
    current.count += 1
    summaries[item.course_id] = current
  }

  return { summaries, error: null }
}

export function formatRatingAverage(average: number) {
  return average > 0 ? average.toFixed(1) : '—'
}
