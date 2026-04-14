'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Course, Chapter, Enrollment } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
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

        // Get chapters
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })

        setChapters(chaptersData || [])

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
            <div className="p-4 bg-primary/10 text-primary rounded-lg">
              ✓ أنت مسجل في هذه الدورة
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
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
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
