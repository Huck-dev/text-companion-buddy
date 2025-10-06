-- Enable pgcrypto extension for secure random generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the handle_new_user function with proper random generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Generate Ethereum-style address (20 bytes = 40 hex chars)
  -- Generate Solana-style address (32 random base58 characters)
  INSERT INTO public.profiles (id, wallet_address, solana_address)
  VALUES (
    new.id,
    '0x' || encode(gen_random_bytes(20), 'hex'),
    encode(gen_random_bytes(24), 'base64')
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile: %', SQLERRM;
    RETURN new;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();