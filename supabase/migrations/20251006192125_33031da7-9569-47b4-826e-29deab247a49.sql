-- Add servers table to store server definitions with code and apps
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  server_type server_type NOT NULL,
  endpoint TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  code TEXT,
  app_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Users can view their own servers
CREATE POLICY "Users can view their own servers"
ON public.servers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public servers
CREATE POLICY "Users can view public servers"
ON public.servers
FOR SELECT
USING (is_public = true);

-- Users can insert their own servers
CREATE POLICY "Users can insert their own servers"
ON public.servers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own servers
CREATE POLICY "Users can update their own servers"
ON public.servers
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own servers
CREATE POLICY "Users can delete their own servers"
ON public.servers
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_servers_updated_at
BEFORE UPDATE ON public.servers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Link servers to compatible compute hosts
ALTER TABLE public.compute_hosts
ADD COLUMN compatible_server_types server_type[] DEFAULT ARRAY['misc']::server_type[];