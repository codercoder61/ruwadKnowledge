'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Course, Chapter } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '',
    is_published: false,
  })
  const [newChapter, setNewChapter] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()

        if (courseData) {
          setCourse(courseData)
          setFormData({
            title: courseData.title,
            description: courseData.description || '',
            level: courseData.level,
            category: courseData.category || '',
            is_published: courseData.is_published,
          })
        }

        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })

        setChapters(chaptersData || [])
      } catch (error) {
        console.error('Error fetching course:', error)
        setError('فشل تحميل بيانات الدورة')
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchData()
    }
  }, [courseId])

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: formData.title,
          description: formData.description,
          level: formData.level,
          category: formData.category,
          is_published: false,
        })
        .eq('id', courseId)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الدورة')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const nextOrder = Math.max(0, ...chapters.map(c => c.order_index), -1) + 1

      const { data, error } = await supabase
        .from('chapters')
        .insert({
          course_id: courseId,
          title: newChapter.title,
          description: newChapter.description,
          order_index: nextOrder,
        })
        .select()

      if (error) throw error

      if (data) {
        setChapters([...chapters, data[0]])
        setNewChapter({ title: '', description: '' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة الفصل')
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('هل تريد حذف هذا الفصل؟')) return

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)

      if (error) throw error

      setChapters(chapters.filter(c => c.id !== chapterId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الفصل')
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
          <Link href="/dashboard">
            <Button>العودة للوحة</Button>
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
          <Link href="/dashboard" className="text-primary hover:underline mb-4 block">
            ← العودة لوحتي
          </Link>
          <h1 className="text-3xl font-bold mb-2">تعديل الدورة</h1>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Course Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>إعدادات الدورة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">عنوان الدورة</label>
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
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">المستوى</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="beginner">مبتدئ</option>
                    <option value="intermediate">متوسط</option>
                    <option value="advanced">متقدم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الفئة</label>
                  <Input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
              </div>

              

              <Button type="submit" disabled={updating} className="w-full">
                {updating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chapters Management */}
        <Card>
          <CardHeader>
            <CardTitle>الفصول</CardTitle>
            <CardDescription>إدارة فصول الدورة والدروس</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Chapter */}
            <form onSubmit={handleAddChapter} className="space-y-3 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">إضافة فصل جديد</h3>
              <div>
                <Input
                  type="text"
                  value={newChapter.title}
                  onChange={(e) =>
                    setNewChapter({ ...newChapter, title: e.target.value })
                  }
                  placeholder="عنوان الفصل"
                  required
                />
              </div>
              <div>
                <textarea
                  value={newChapter.description}
                  onChange={(e) =>
                    setNewChapter({ ...newChapter, description: e.target.value })
                  }
                  placeholder="وصف الفصل (اختياري)"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">
                إضافة الفصل
              </Button>
            </form>

            {/* Chapters List */}
            {chapters.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                لم تضف أي فصول حتى الآن
              </p>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="p-4 border border-border rounded-lg flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{chapter.title}</h4>
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${courseId}/chapters/${chapter.id}/manage`}
                      >
                        <Button size="sm" variant="outline">
                          إدارة الدروس
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteChapter(chapter.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
