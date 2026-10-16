'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MessageCircle, Send } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type Comment = {
  id: string
  author: string
  content: string
  createdAt: string
}

type CommentsSectionProps = {
  title: string
  description: string
  courseId: string
  lessonId?: string
}

export function CommentsSection({ title, description, courseId, lessonId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadComments() {
      const query = supabase
        .from('comments')
        .select('id, author_name, content, created_at')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true })

      const { data, error: loadError } = lessonId
        ? await query.eq('lesson_id', lessonId)
        : await query.is('lesson_id', null)

      if (isMounted) {
        if (loadError) setError('Impossible de charger les commentaires.')
        else setComments((data ?? []).map((comment) => ({
          id: comment.id,
          author: comment.author_name,
          content: comment.content,
          createdAt: new Date(comment.created_at).toLocaleString('fr-FR'),
        })))
        setIsLoading(false)
      }
    }

    void loadComments()
    return () => { isMounted = false }
  }, [courseId, lessonId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()

    if (!content) {
      setError('Écrivez un commentaire avant de publier.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        course_id: courseId,
        lesson_id: lessonId ?? null,
        author_name: 'Vous',
        content,
      })
      .select('id, author_name, content, created_at')
      .single()

    setIsSubmitting(false)
    if (insertError || !data) {
      setError('Impossible de publier le commentaire. Vérifiez que la table comments est disponible.')
      return
    }

    setComments((current) => [...current, {
      id: data.id,
      author: data.author_name,
      content: data.content,
      createdAt: new Date(data.created_at).toLocaleString('fr-FR'),
    }])
    setDraft('')
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-10 bg-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              <MessageCircle data-icon="inline-start" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Partagez votre question ou votre avis..."
            aria-label="Votre commentaire"
            maxLength={1000}
            rows={4}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{draft.length}/1000 caractères</p>
            <Button type="submit" disabled={!draft.trim() || isSubmitting}>
              {isSubmitting ? 'Publication…' : null}
              <Send data-icon="inline-start" />
              Publier le commentaire
            </Button>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </form>

        {isLoading ? (
          <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground" aria-live="polite">
            Chargement des commentaires…
          </p>
        ) : comments.length > 0 ? (
          <div className="flex flex-col gap-4" aria-live="polite">
            {comments.map((comment) => (
              <article key={comment.id} className="flex gap-3 border-t pt-4 first:border-t-0 first:pt-0">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback>{comment.author.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{comment.author}</p>
                    <time className="text-xs text-muted-foreground">{comment.createdAt}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            Aucun commentaire pour le moment. Soyez le premier à participer.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
