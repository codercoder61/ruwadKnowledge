import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getCourseProgress(courseId: string, studentId: string) {
  // 1. Get all lessons in the course
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('id, chapter_id, chapters!inner(course_id)')
    .eq('chapters.course_id', courseId)

  if (lessonError) throw lessonError

  const lessonIds = lessons.map(l => l.id)

  // 2. Get completed progress for those lessons
  const { data: progress, error: progressError } = await supabase
    .from('progress')
    .select('lesson_id, completed')
    .eq('student_id', studentId)
    .in('lesson_id', lessonIds)
    .eq('completed', true)

  if (progressError) throw progressError

  const completedCount = progress.length
  const totalCount = lessonIds.length

  // 3. Calculate percentage
  const percentage =
    totalCount === 0 ? 0 : (completedCount / totalCount) * 100

  return {
    totalLessons: totalCount,
    completedLessons: completedCount,
    percentage: Math.round(percentage),
  }
}