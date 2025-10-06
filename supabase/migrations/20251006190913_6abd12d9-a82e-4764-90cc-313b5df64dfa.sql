-- Create enum for compute host status
CREATE TYPE public.compute_host_status AS ENUM ('online', 'offline', 'busy', 'maintenance');

-- Create enum for execution status
CREATE TYPE public.execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Create compute_hosts table
CREATE TABLE public.compute_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  capabilities JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  status compute_host_status NOT NULL DEFAULT 'offline',
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  profit_share_percentage INTEGER DEFAULT 70 CHECK (profit_share_percentage >= 0 AND profit_share_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE
);

-- Create compute_executions table
CREATE TABLE public.compute_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  host_id UUID REFERENCES public.compute_hosts(id) ON DELETE SET NULL,
  mcp_server_name TEXT NOT NULL,
  function_name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  status execution_status NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  cost_credits INTEGER NOT NULL,
  host_earnings DECIMAL(10, 2),
  platform_earnings DECIMAL(10, 2),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compute_payments table
CREATE TABLE public.compute_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES public.compute_hosts(id) ON DELETE CASCADE NOT NULL,
  execution_id UUID REFERENCES public.compute_executions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compute_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compute_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compute_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compute_hosts
CREATE POLICY "Users can view all active hosts"
  ON public.compute_hosts FOR SELECT
  USING (status IN ('online', 'busy'));

CREATE POLICY "Users can insert their own hosts"
  ON public.compute_hosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hosts"
  ON public.compute_hosts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for compute_executions
CREATE POLICY "Users can view their own executions"
  ON public.compute_executions FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Host owners can view executions on their hosts"
  ON public.compute_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.compute_hosts
      WHERE compute_hosts.id = compute_executions.host_id
      AND compute_hosts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create executions"
  ON public.compute_executions FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS Policies for compute_payments
CREATE POLICY "Host owners can view their payments"
  ON public.compute_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.compute_hosts
      WHERE compute_hosts.id = compute_payments.host_id
      AND compute_hosts.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_compute_hosts_updated_at
  BEFORE UPDATE ON public.compute_hosts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to select best host for execution
CREATE OR REPLACE FUNCTION public.select_best_host(
  required_capabilities TEXT[],
  preferred_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  selected_host_id UUID;
BEGIN
  SELECT id INTO selected_host_id
  FROM public.compute_hosts
  WHERE status = 'online'
    AND (
      required_capabilities IS NULL
      OR capabilities @> to_jsonb(required_capabilities)
    )
    AND (
      preferred_location IS NULL
      OR location = preferred_location
    )
  ORDER BY
    CASE WHEN location = preferred_location THEN 0 ELSE 1 END,
    (successful_executions::float / NULLIF(total_executions, 0)) DESC NULLS LAST,
    total_executions DESC
  LIMIT 1;
  
  RETURN selected_host_id;
END;
$$;