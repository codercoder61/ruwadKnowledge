'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">رواد المعرفة</h1>
          <nav className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">تسجيل الدخول</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>إنشاء حساب</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
           بوابتك لاكتساب المعرفة في كل المجالات
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
منصة شاملة لتعلّم مجالات متنوعة للطلاب من جميع المستويات. تعلّم على يد خبراء متخصصين وطوّر مهاراتك وفق وتيرتك الخاصة.          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                ابدأ التعلم الآن
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                دخول الطلاب الحاليين
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-card rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-3">محتوى متخصص</h3>
              <p className="text-muted-foreground">
                دروس مستوحاة من خبرات مدرسين متخصصين
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-3">تتبع التقدم</h3>
              <p className="text-muted-foreground">
                راقب تقدمك في الدراسة وانجز أهدافك التعليمية بسهولة
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-3">تعلم في أي وقت</h3>
              <p className="text-muted-foreground">
                احصل على الوصول المجاني لجميع الدروس في أي وقت يناسبك
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
