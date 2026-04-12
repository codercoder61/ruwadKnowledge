-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can view instructor profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Add the INSERT policy for signup
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-create the other policies
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
