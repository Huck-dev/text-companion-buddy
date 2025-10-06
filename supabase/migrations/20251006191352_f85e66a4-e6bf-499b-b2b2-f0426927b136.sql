-- Create server type enum
CREATE TYPE public.server_type AS ENUM ('mcp', 'a2a', 'misc');

-- Add server type columns to compute tables
ALTER TABLE public.compute_hosts 
  ADD COLUMN server_type server_type DEFAULT 'misc',
  ADD COLUMN server_info JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.compute_executions
  ADD COLUMN server_type server_type DEFAULT 'misc';

-- Rename mcp_server_name to server_name for clarity
ALTER TABLE public.compute_executions 
  RENAME COLUMN mcp_server_name TO server_name;

-- Update the select_best_host function to consider server type
DROP FUNCTION IF EXISTS public.select_best_host(TEXT[], TEXT);

CREATE OR REPLACE FUNCTION public.select_best_host(
  required_capabilities TEXT[],
  preferred_location TEXT DEFAULT NULL,
  required_server_type server_type DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    AND (
      required_server_type IS NULL
      OR server_type = required_server_type
    )
  ORDER BY
    CASE WHEN location = preferred_location THEN 0 ELSE 1 END,
    CASE WHEN server_type = required_server_type THEN 0 ELSE 1 END,
    (successful_executions::float / NULLIF(total_executions, 0)) DESC NULLS LAST,
    total_executions DESC
  LIMIT 1;
  
  RETURN selected_host_id;
END;
$$;