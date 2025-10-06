-- Enable pgcrypto extension for random bytes generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the handle_new_user function to ensure it works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, wallet_address)
  VALUES (
    new.id,
    '0x' || encode(gen_random_bytes(20), 'hex')
  );
  RETURN new;
END;
$$;