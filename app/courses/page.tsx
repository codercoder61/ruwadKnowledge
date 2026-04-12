'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Course } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')

  useEffect(() => {
    const fetchCourses = async () => {
      // Get published courses only
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)

      if (error) {
        console.error('Error fetching courses:', error)
      } else {
        setCourses(data || [])
        setFilteredCourses(data || [])
      }
      setLoading(false)
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    if (search) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(search.toLowerCase()) ||
          course.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (level) {
      filtered = filtered.filter((course) => course.level === level)
    }

    setFilteredCourses(filtered)
  }, [search, level, courses])

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
          <Link href="/dashboard">
            <Button variant="ghost">لوحتي</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">استكشف الدورات</h2>
          <p className="text-muted-foreground">
            اختر من عشرات الدورات المتخصصة للتعلم
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Input
            placeholder="ابحث عن دورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">جميع المستويات</option>
            <option value="beginner">مبتدئ</option>
            <option value="intermediate">متوسط</option>
            <option value="advanced">متقدم</option>
          </select>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                لم نجد دورات تطابق بحثك
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setLevel('')
                }}
              >
                إعادة تعيين الفلاتر
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {course.thumbnail_url && (
                    <div className="w-full h-40 bg-muted overflow-hidden">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {course.level} • {course.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
