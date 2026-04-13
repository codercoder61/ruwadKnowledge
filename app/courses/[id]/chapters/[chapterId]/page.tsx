'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Chapter, Lesson } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ChapterPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const chapterId = params?.chapterId as string

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

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

        // Get chapter
        const { data: chapterData } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single()

        setChapter(chapterData)

        // Get lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('chapter_id', chapterId)
          .order('order_index', { ascending: true })

        setLessons(lessonsData || [])
      } catch (error) {
        console.error('Error fetching chapter:', error)
      } finally {
        setLoading(false)
      }
    }

    if (chapterId) {
      fetchData()
    }
  }, [chapterId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">الفصل غير موجود</p>
          <Link href={`/courses/${courseId}`}>
            <Button>العودة للدورة</Button>
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
            href={`/courses/${courseId}`}
            className="text-primary hover:underline mb-4 block"
          >
            ← العودة للدورة
          </Link>
          <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
          {chapter.description && (
            <p className="text-lg text-muted-foreground">{chapter.description}</p>
          )}
        </div>

        {/* Lessons */}
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد دروس في هذا الفصل حتى الآن
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 flex flex-wrap justify-center flex-row-reverse">
            {lessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {lesson.duration_minutes && (
                      <span className="text-xs text-muted-foreground">
                        ⏱ {lesson.duration_minutes} دقيقة
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`}
                  >
                    <Button className="w-full">عرض الدرس</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
