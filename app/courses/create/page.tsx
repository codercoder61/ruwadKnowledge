'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function CreateCoursePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: '',
    thumbnail_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase.from('courses').insert({
        title: formData.title,
        description: formData.description,
        level: formData.level,
        category: formData.category,
        thumbnail_url: formData.thumbnail_url,
        instructor_id: session.user.id,
        is_published: false,
      }).select().single()

      if (error) throw error
      console.log(data)
      if (data) {
        router.push(`/courses/${data.id}/edit`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الدورة')
    } finally {
      setLoading(false)
    }
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline mb-4 block">
            ← العودة لوحتي
          </Link>
          <h1 className="text-3xl font-bold mb-2">إنشاء دورة جديدة</h1>
          <p className="text-muted-foreground">
            أنشئ دورة جديدة وأضف فصول ودروس لها
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>بيانات الدورة الأساسية</CardTitle>
            <CardDescription>
              ملأ البيانات التالية لإنشاء دورتك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">عنوان الدورة</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="مثال: أساسيات اللغة العربية"
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
                  placeholder="وصف شامل للدورة والأهداف المراد تحقيقها"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  rows={5}
                  required
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
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">رابط الصورة المصغرة</label>
                <Input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'جاري الإنشاء...' : 'إنشاء الدورة'}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    إلغاء
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
