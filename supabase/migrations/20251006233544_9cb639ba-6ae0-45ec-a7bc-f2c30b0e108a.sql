-- Create friends table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Users can view their own friends
CREATE POLICY "Users can view their own friends"
ON public.friends
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add their own friends
CREATE POLICY "Users can add their own friends"
ON public.friends
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own friends
CREATE POLICY "Users can delete their own friends"
ON public.friends
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_user_id ON public.friends(friend_user_id);