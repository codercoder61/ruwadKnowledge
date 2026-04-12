-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extending auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
  profile_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  language TEXT DEFAULT 'Arabic',
  category TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  video_url TEXT,
  content TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, course_id)
);

-- Create progress table
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, lesson_id)
);

-- Create moderation_reports table
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX idx_courses_is_published ON public.courses(is_published);
CREATE INDEX idx_chapters_course_id ON public.chapters(course_id);
CREATE INDEX idx_lessons_chapter_id ON public.lessons(chapter_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX idx_progress_student_id ON public.progress(student_id);
CREATE INDEX idx_progress_lesson_id ON public.progress(lesson_id);
CREATE INDEX idx_moderation_reports_status ON public.moderation_reports(status);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view instructor profiles" ON public.users
  FOR SELECT USING (role = 'instructor');

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for courses table
CREATE POLICY "Anyone can read published courses" ON public.courses
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Instructors can read their own courses" ON public.courses
  FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Instructors can create courses" ON public.courses
  FOR INSERT WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Instructors can update their own courses" ON public.courses
  FOR UPDATE USING (instructor_id = auth.uid());

-- RLS Policies for chapters table
CREATE POLICY "Anyone can read chapters of published courses" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses WHERE id = course_id AND is_published = TRUE
    )
  );

CREATE POLICY "Instructors can manage their course chapters" ON public.chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()
    )
  );

-- RLS Policies for lessons table
CREATE POLICY "Anyone can read lessons from published courses" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.courses ON chapters.course_id = courses.id
      WHERE chapters.id = chapter_id AND courses.is_published = TRUE
    )
  );

CREATE POLICY "Instructors can manage their course lessons" ON public.lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chapters
      JOIN public.courses ON chapters.course_id = courses.id
      WHERE chapters.id = chapter_id AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for enrollments table
CREATE POLICY "Students can read their own enrollments" ON public.enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can read enrollments in their courses" ON public.enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll in courses" ON public.enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- RLS Policies for progress table
CREATE POLICY "Students can read their own progress" ON public.progress
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can read progress of their students" ON public.progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      JOIN public.chapters ON lessons.chapter_id = chapters.id
      JOIN public.courses ON chapters.course_id = courses.id
      WHERE lessons.id = lesson_id AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own progress" ON public.progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own progress record" ON public.progress
  FOR UPDATE USING (student_id = auth.uid());

-- RLS Policies for moderation_reports table
CREATE POLICY "Users can read their own reports" ON public.moderation_reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins can read all reports" ON public.moderation_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create reports" ON public.moderation_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can update reports" ON public.moderation_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );
