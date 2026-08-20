'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Course, Chapter, Enrollment } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface CourseWithChapters extends Course {
  chapters?: Chapter[]
}

export default function CourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string

  const [course, setCourse] = useState<CourseWithChapters | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set())
  const [ratingAverage, setRatingAverage] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [myRating, setMyRating] = useState(0)
  const [savingRating, setSavingRating] = useState(false)
  const [ratingError, setRatingError] = useState('')

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/login')
          return
        }

        // Get user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser(userData)

        // Get course
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        setCourse(courseData)

        setRatingAverage(0)
        setRatingCount(0)
        setMyRating(0)
        setRatingError('')
        const { data: ratings, error: ratingsError } = await supabase
          .from('course_ratings')
          .select('rating, student_id')
          .eq('course_id', courseId)
        if (ratingsError) {
          console.error('[v0] Failed to load course rating:', ratingsError.message)
          setRatingError('تعذر تحميل التقييمات حالياً')
        } else if (ratings?.length) {
          setRatingCount(ratings.length)
          setRatingAverage(ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length)
          const ownRating = ratings.find((item) => item.student_id === session.user.id)
          setMyRating(ownRating?.rating || 0)
        }

        // Get chapters
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })

        setChapters(chaptersData || [])

        if (userData?.role === 'student' && session.user.id && (chaptersData || []).length > 0) {
          const chapterIds = (chaptersData || []).map((chapter) => chapter.id)
          const { data: lessons } = await supabase.from('lessons').select('id, chapter_id').in('chapter_id', chapterIds)
          const lessonIds = lessons?.map((lesson) => lesson.id) || []
          const { data: progress } = lessonIds.length
            ? await supabase.from('progress').select('lesson_id').eq('student_id', session.user.id).eq('completed', true).in('lesson_id', lessonIds)
            : { data: [] as { lesson_id: string }[] }
          const completedLessonIds = new Set(progress?.map((item) => item.lesson_id) || [])
          const nextCompletedChapters = new Set<string>()

          for (const chapter of chaptersData || []) {
            const chapterLessonIds = (lessons || []).filter((lesson) => lesson.chapter_id === chapter.id).map((lesson) => lesson.id)
            if (chapterLessonIds.length > 0 && chapterLessonIds.every((lessonId) => completedLessonIds.has(lessonId))) {
              nextCompletedChapters.add(chapter.id)
            }
          }
          setCompletedChapters(nextCompletedChapters)
        }

        // Check if user is enrolled
        if (userData?.role === 'student') {
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('*')
            .eq('student_id', session.user.id)
            .eq('course_id', courseId)
            .single()

          setEnrollment(enrollmentData || null)
        }
      } catch (error) {
        console.error('Error fetching course:', error)
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseData()
    }
  }, [courseId, router])

  const handleRating = async (rating: number) => {
    if (!user || !enrollment) return
    setSavingRating(true)
    setRatingError('')
    const { error } = await supabase.from('course_ratings').upsert(
      { course_id: courseId, student_id: user.id, rating, updated_at: new Date().toISOString() },
      { onConflict: 'course_id,student_id' },
    )
    if (error) {
      console.error('[v0] Failed to save course rating:', error.message)
      setRatingError('تعذر حفظ تقييمك. تأكد من تفعيل جدول التقييمات ثم حاول مرة أخرى.')
    } else {
      const nextCount = myRating ? ratingCount : ratingCount + 1
      setRatingAverage((ratingAverage * ratingCount - (myRating || 0) + rating) / nextCount)
      setRatingCount(nextCount)
      setMyRating(rating)
    }
    setSavingRating(false)
  }

  const handleEnroll = async () => {
    if (!user) return

    setEnrolling(true)
    try {
      const { data, error } = await supabase.from('enrollments').insert({
        student_id: user.id,
        course_id: courseId,
      })

      if (error) throw error

      setEnrollment(data?.[0] || { student_id: user.id, course_id: courseId })
    } catch (error) {
      console.error('Enrollment error:', error)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">الدورة غير موجودة</p>
          <Link href="/courses">
            <Button>العودة إلى الدورات</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">رواد المعرفة</h1>
          <Link href="/dashboard">
            <Button variant="ghost">لوحتي</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="mb-8">
          <Link href="/courses" className="text-primary hover:underline mb-4 block">
            ← العودة للدورات
          </Link>
          <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
          <p className="text-lg text-muted-foreground mb-4">{course.description}</p>

          <p className="mb-4 text-sm text-muted-foreground" aria-label={`متوسط التقييم ${ratingCount > 0 ? ratingAverage.toFixed(1) : 'لا يوجد'} من 5`}>
            <span className="text-amber-500" aria-hidden="true">★</span>{' '}
            {ratingCount > 0 ? `${ratingAverage.toFixed(1)} من 5 (${ratingCount} تقييم)` : 'لا توجد تقييمات بعد'}
          </p>
          {ratingError && <p className="mb-4 text-sm text-destructive">{ratingError}</p>}

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              {course.level}
            </span>
            <span className="px-3 py-1 bg-secondary/10  rounded-full text-sm">
              {course.category}
            </span>
          </div>

          {user?.role === 'student' && !enrollment && (
            <Button size="lg" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'جاري التسجيل...' : 'التسجيل في الدورة'}
            </Button>
          )}

          {enrollment && (
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-primary/10 text-primary rounded-lg">
                ✓ أنت مسجل في هذه الدورة
              </div>
              <fieldset className="flex flex-col gap-2" disabled={savingRating}>
                <legend className="text-sm font-medium">قيّم هذه الدورة</legend>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="تقييم الدورة من 1 إلى 5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={myRating === value}
                      aria-label={`${value} من 5 نجوم`}
                      onClick={() => handleRating(value)}
                      className="rounded-md p-1 text-2xl leading-none text-muted-foreground transition-colors hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={value <= myRating ? 'text-amber-500' : ''} aria-hidden="true">★</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </div>

        {/* Chapters */}
        <div>
          <h2 className="text-2xl font-bold mb-6">محتوى الدورة</h2>

          {chapters.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                لا توجد فصول في هذه الدورة حتى الآن
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 flex justify-center flex-wrap flex-row-reverse">
              {chapters.map((chapter) => (
                <Card className="m-4 w-full sm:w-[300px]" key={chapter.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      {completedChapters.has(chapter.id) && <Badge variant="secondary">مكتمل</Badge>}
                    </div>
                    {chapter.description && (
                      <CardDescription>{chapter.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                   {user?.role === 'student' && (
  enrollment ? (
    <Link href={`/courses/${courseId}/chapters/${chapter.id}`}>
      <Button className="w-full">
        عرض دروس الفصل
      </Button>
    </Link>
  ) : (
    <Button disabled className="w-full">
      سجل للوصول إلى الدروس
    </Button>
  )
)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
