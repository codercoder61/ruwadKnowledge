import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getCourseProgress(
  courseId: string,
  studentId: string
) {
  // Get all lessons belonging to the course
  const { data: lessons, error: lessonError } = await supabase
    .from("lessons")
    .select(`
      id,
      chapters!inner (
        course_id
      )
    `)
    .eq("chapters.course_id", courseId);

  if (lessonError) throw lessonError;

  const lessonIds = lessons?.map((lesson) => lesson.id) ?? [];

  // Prevent `.in()` from being called with an empty array
  if (lessonIds.length === 0) {
    return {
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
    };
  }

  // Get completed lessons
  const { data: progress, error: progressError } = await supabase
    .from("progress")
    .select("lesson_id")
    .eq("student_id", studentId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  if (progressError) throw progressError;

  const completedCount = progress?.length ?? 0;
  const totalCount = lessonIds.length;

  return {
    totalLessons: totalCount,
    completedLessons: completedCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}
