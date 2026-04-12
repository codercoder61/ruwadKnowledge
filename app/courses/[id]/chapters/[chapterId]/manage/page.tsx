'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Chapter, Lesson } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ManageLessonsPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const chapterId = params?.chapterId as string

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    content: '',
    duration_minutes: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: chapterData } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single()

        setChapter(chapterData)

        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('chapter_id', chapterId)
          .order('order_index', { ascending: true })

        setLessons(lessonsData || [])
      } catch (error) {
        console.error('Error fetching lessons:', error)
        setError('فشل تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }

    if (chapterId) {
      fetchData()
    }
  }, [chapterId])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      content: '',
      duration_minutes: '',
    })
    setEditingLesson(null)
    setShowForm(false)
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (editingLesson) {
        // Update lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            description: formData.description,
            video_url: formData.video_url,
            content: formData.content,
            duration_minutes: formData.duration_minutes
              ? parseInt(formData.duration_minutes)
              : null,
          })
          .eq('id', editingLesson.id)

        if (error) throw error

        setLessons(
          lessons.map((l) =>
            l.id === editingLesson.id
              ? {
                  ...l,
                  title: formData.title,
                  description: formData.description,
                  video_url: formData.video_url,
                  content: formData.content,
                  duration_minutes: formData.duration_minutes
                    ? parseInt(formData.duration_minutes)
                    : null,
                }
              : l
          )
        )
      } else {
        // Create lesson
        const nextOrder = Math.max(0, ...lessons.map(l => l.order_index), -1) + 1

        const { data, error } = await supabase
          .from('lessons')
          .insert({
            chapter_id: chapterId,
            title: formData.title,
            description: formData.description,
            video_url: formData.video_url,
            content: formData.content,
            duration_minutes: formData.duration_minutes
              ? parseInt(formData.duration_minutes)
              : null,
            order_index: nextOrder,
          })
          .select()

        if (error) throw error

        if (data) {
          setLessons([...lessons, data[0]])
        }
      }

      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ الدرس')
    }
  }

  const handleEditLesson = (lesson: Lesson) => {
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      video_url: lesson.video_url || '',
      content: lesson.content || '',
      duration_minutes: lesson.duration_minutes?.toString() || '',
    })
    setEditingLesson(lesson)
    setShowForm(true)
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل تريد حذف هذا الدرس؟')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      setLessons(lessons.filter((l) => l.id !== lessonId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الدرس')
    }
  }

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
          <Link href={`/courses/${courseId}/edit`}>
            <Button>العودة</Button>
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href={`/courses/${courseId}/edit`}
            className="text-primary hover:underline mb-4 block"
          >
            ← العودة لتعديل الدورة
          </Link>
          <h1 className="text-3xl font-bold mb-2">إدارة دروس الفصل</h1>
          <p className="text-muted-foreground">{chapter.title}</p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Add/Edit Lesson Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان الدرس</label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">رابط الفيديو (YouTube)</label>
                  <Input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, video_url: e.target.value })
                    }
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">محتوى الدرس</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    rows={5}
                    placeholder="محتوى إضافي للدرس..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">مدة الدرس (بالدقائق)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_minutes: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingLesson ? 'حفظ التعديلات' : 'إضافة الدرس'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lessons List */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-8">
            + إضافة درس جديد
          </Button>
        )}

        {lessons.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد دروس في هذا الفصل حتى الآن
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 border border-border rounded-lg flex items-start justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{lesson.title}</h4>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {lesson.description}
                    </p>
                  )}
                  {lesson.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏱ {lesson.duration_minutes} دقيقة
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditLesson(lesson)}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteLesson(lesson.id)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
