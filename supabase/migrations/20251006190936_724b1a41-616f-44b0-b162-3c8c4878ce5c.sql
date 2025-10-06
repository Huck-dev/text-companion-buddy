-- Fix security warning: set search_path for select_best_host function
DROP FUNCTION IF EXISTS public.select_best_host(TEXT[], TEXT);

CREATE OR REPLACE FUNCTION public.select_best_host(
  required_capabilities TEXT[],
  preferred_location TEXT DEFAULT NULL
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
  ORDER BY
    CASE WHEN location = preferred_location THEN 0 ELSE 1 END,
    (successful_executions::float / NULLIF(total_executions, 0)) DESC NULLS LAST,
    total_executions DESC
  LIMIT 1;
  
  RETURN selected_host_id;
END;
$$;