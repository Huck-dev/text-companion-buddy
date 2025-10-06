-- Add solana_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS solana_address TEXT;