import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'student' | 'instructor' | 'admin'

export interface User {
  id: string
  email: string
  full_name?: string
  role: UserRole
  profile_image_url?: string
  bio?: string
  created_at: string
}

export interface Course {
  id: string
  title: string
  description?: string
  instructor_id: string
  level: 'beginner' | 'intermediate' | 'advanced'
  language: string
  category?: string
  thumbnail_url?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  course_id: string
  title: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  chapter_id: string
  title: string
  description?: string
  order_index: number
  video_url?: string
  content?: string
  duration_minutes?: number
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
}

export interface Progress {
  id: string
  student_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
}


