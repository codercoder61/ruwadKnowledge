'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, Course, Enrollment } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
type CourseProgress = {
  course_id: string
  percentage: number
}


export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [coursesForAdmin, setCoursesForAdmin] = useState<Course[]>([])
const [formData, setFormData] = useState({
    is_published: false,
  })

  const togglePublish = async (courseId: string, value: boolean) => {
  setFormData({ ...formData, is_published: value })

  const { error } = await supabase
    .from('courses')
    .update({ is_published: value })
    .eq('id', courseId)

  if (error) console.error(error)
}


const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  useEffect(() => {
    const checkAuth = async () => {
      const {
  data: { session },
  error,} = await supabase.auth.refreshSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        console.error('User fetch error:', userError)
        return
      }

      setUser(userData)

      // If instructor, get their courses
      if (userData.role === 'instructor') {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor_id', userData.id)

        setCourses(coursesData || [])
        setLoading(false)
        return
      }



      if (userData.role === 'admin') {
        const { data: coursesDataForAdmin } = await supabase
          .from('courses')
          .select('*')

        setCoursesForAdmin(coursesDataForAdmin || [])
        setLoading(false)
        return
      }




      // If student, get enrollments and enrolled courses
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', session.user.id)

      if (enrollmentsData) {
        setEnrollments(enrollmentsData)

        // Get enrolled course details
        const courseIds = enrollmentsData.map((e) => e.course_id)
        if (courseIds.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', courseIds)

          setCourses(coursesData || [])
        }
      }

      // 3. NOW safely call RPC (after user is known)
    const { data: progressData } = await supabase.rpc(
  'get_courses_progress',
  { student_id: session.user.id }
) as { data: CourseProgress[] | null }

    const map = Object.fromEntries(
  (progressData || []).map((p: CourseProgress) => [
    p.course_id,
    p.percentage,
  ])
)

    setProgressMap(map)

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">رواد المعرفة</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {user?.role === 'instructor' ? 'لوحة المدرس' : user?.role !== 'admin' ? 'لوحة الطالب':"لوحة الإدارة"}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === 'instructor'
              ? 'أدر دوراتك والمحتوى التعليمي':
              user?.role !== 'admin' ? 'متابعة تقدمك في الدراسة' : "لوحة تحكم الإدارة"}
          </p>
        </div>

        {/* Instructor Dashboard */}
        {user?.role === 'instructor' && (
          <div className="space-y-6">
            <Link href="/courses/create">
              <Button>إنشاء دورة جديدة</Button>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {course.level} • {course.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.id}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          تعديل
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          عرض
                        </Button>
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {course.is_published ? '✓ منشورة' : '⊘ مسودة'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Student Dashboard */}
        {user?.role === 'student' && (
          <div className="space-y-6">
            <Link href="/courses">
              <Button>استكشف الدورات</Button>
            </Link>

            {courses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    لم تسجل في أي دورات حتى الآن
                  </p>
                  <Link href="/courses">
                    <Button>ابحث عن دورات</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {courses.map((course) => {
    const enrollment = enrollments.find(
      (e) => e.course_id === course.id
    )

    const percentage = progressMap[course.id] || 0

    return (
      <Card key={course.id}>
        <CardHeader>
          <CardTitle className="text-lg">
            {course.title}
          </CardTitle>

          <CardDescription className="text-xs">
            {course.level} • {course.category}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          {/* 🔥 REAL PROGRESS BAR */}
          <div className="bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* 🔥 REAL PERCENTAGE */}
          <p className="text-xs text-muted-foreground">
            {Math.round(percentage)}% مكتمل
          </p>

          <Link href={`/courses/${course.id}`}>
            <Button className="w-full">
              متابعة الدراسة
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  })}
</div>
            )}
          </div>
        )}

        {/* Admin Dashboard */}
        {user?.role === 'admin' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesForAdmin.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {course.level} • {course.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.id}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          تعديل
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          عرض
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
               <input
  type="checkbox"
  checked={course.is_published}
  onChange={async (e) => {
    const value = e.target.checked

    // 🔥 optimistic UI update
    setCoursesForAdmin((prev) =>
      prev.map((c) =>
        c.id === course.id
          ? { ...c, is_published: value }
          : c
      )
    )

    // DB update
    const { error } = await supabase
      .from('courses')
      .update({ is_published: value })
      .eq('id', course.id)

    if (error) {
      console.error(error)

      // rollback if fail
      setCoursesForAdmin((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? { ...c, is_published: !value }
            : c
        )
      )
    }
  }}
/>
                <label htmlFor="published" className="text-sm">
                  نشر الدورة للطلاب
                </label>
              </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        )}
      </main>
    </div>
  )
}


