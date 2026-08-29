'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const redirectBase = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? window.location.origin
    const redirectTo = `${redirectBase.replace(/\/$/, '')}/auth/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError('تعذر إرسال رابط إعادة التعيين. حاول مرة أخرى.')
    } else {
      setMessage('إذا كان البريد مسجلاً، فستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور.')
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription>أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            {message && <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">البريد الإلكتروني</label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'جاري الإرسال...' : 'إرسال الرابط'}
            </Button>
          </form>
          <div className="mt-6 flex justify-between text-sm">
            <Link href="/auth/login" className="font-medium text-primary hover:underline">العودة لتسجيل الدخول</Link>
            <Link href="/" className="font-medium text-primary hover:underline">الصفحة الرئيسية</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
