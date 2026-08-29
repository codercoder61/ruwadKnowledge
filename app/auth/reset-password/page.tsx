'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 6) return setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.')
    if (password !== confirmation) return setError('كلمتا المرور غير متطابقتين.')
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) setError('تعذر تحديث كلمة المرور. أعد طلب رابط جديد.')
    else {
      setMessage('تم تحديث كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول.')
      setTimeout(() => router.replace('/auth/login'), 1500)
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">تعيين كلمة مرور جديدة</CardTitle>
          <CardDescription>ينطبق هذا على حسابات الطالب والمدرس والمدير</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? <p className="text-center text-sm text-muted-foreground">افتح رابط إعادة التعيين من بريدك الإلكتروني للمتابعة.</p> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              {message && <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>}
              <div><label htmlFor="password" className="mb-2 block text-sm font-medium">كلمة المرور الجديدة</label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></div>
              <div><label htmlFor="confirmation" className="mb-2 block text-sm font-medium">تأكيد كلمة المرور</label><Input id="confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={6} required /></div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</Button>
            </form>
          )}
          <div className="mt-6 text-center text-sm"><Link href="/" className="font-medium text-primary hover:underline">الصفحة الرئيسية</Link></div>
        </CardContent>
      </Card>
    </main>
  )
}
