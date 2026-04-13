'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Lesson, Progress } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const chapterId = params?.chapterId as string
  const lessonId = params?.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
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

        // Get lesson
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single()

        setLesson(lessonData)

        // Get progress
        if (userData?.role === 'student') {
          const { data: progressData } = await supabase
            .from('progress')
            .select('*')
            .eq('student_id', session.user.id)
            .eq('lesson_id', lessonId)
            .single()

          setProgress(progressData || null)
        }
      } catch (error) {
        console.error('Error fetching lesson:', error)
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      fetchData()
    }
  }, [lessonId, router])

  const markAsComplete = async () => {
    if (!user || !lesson) return

    setMarking(true)
    try {
      if (progress) {
        // Update existing progress
        const { error } = await supabase
          .from('progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', progress.id)

        if (error) throw error
      } else {
        // Create new progress
        const { data, error } = await supabase.from('progress').insert({
          student_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        })

        if (error) throw error

        if (data) {
          setProgress(data[0])
        }
      }

      // Refresh progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', user.id)
        .eq('lesson_id', lessonId)
        .single()

      setProgress(progressData || null)
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">الدرس غير موجود</p>
          <Link href={`/courses/${courseId}/chapters/${chapterId}`}>
            <Button>العودة للفصل</Button>
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
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href={`/courses/${courseId}/chapters/${chapterId}`}
            className="text-primary hover:underline mb-4 block"
          >
            ← العودة للفصل
          </Link>
          <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>

          {progress?.completed && (
            <div className="p-4 bg-primary/10 text-primary rounded-lg mb-4">
              ✓ تم إكمال هذا الدرس
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>محتوى الدرس</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lesson.video_url && (
                  <div className="w-full bg-muted rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="400"
                      src={lesson.video_url}
                      title={lesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                {lesson.description && (
                  <div>
                    <h3 className="font-semibold mb-2">الوصف</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {lesson.description}
                    </p>
                  </div>
                )}

                {lesson.content && (
                  <div className="break-words">
                    <h3 className="font-semibold mb-2">المحتوى</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      {lesson.content}
                    </div>
                  </div>
                )}

                {lesson.duration_minutes && (
                  <div className="text-sm text-muted-foreground">
                    ⏱ مدة الدرس: {lesson.duration_minutes} دقيقة
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>تقدمك</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.role === 'student' && !progress?.completed && (
                  <Button
                    onClick={markAsComplete}
                    disabled={marking}
                    className="w-full"
                  >
                    {marking ? 'جاري الحفظ...' : 'تحديد كمكتمل'}
                  </Button>
                )}

                {progress?.completed && (
                  <div className="p-3 bg-primary/10 text-primary rounded-lg text-center">
                    ✓ مكتمل
                  </div>
                )}

                {lesson.duration_minutes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">المدة</p>
                    <p className="font-semibold">{lesson.duration_minutes} دقيقة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="mt-4 space-y-2">
              <Link href={`/courses/${courseId}/chapters/${chapterId}`}>
                <Button variant="outline" className="w-full">
                  العودة للفصل
                </Button>
              </Link>
              <Link href={`/courses/${courseId}`}>
                <Button variant="outline" className="w-full">
                  العودة للدورة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
