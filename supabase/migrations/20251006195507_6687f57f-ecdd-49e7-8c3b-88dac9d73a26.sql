-- Add INSERT policy for profiles so users can create their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);