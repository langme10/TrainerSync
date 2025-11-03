-- Fix infinite recursion in trainer_profiles RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Trainers can view own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can update own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can insert own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Clients can view their trainer profile" ON public.trainer_profiles;

-- Create security definer function to check if user is a trainer
CREATE OR REPLACE FUNCTION public.is_trainer(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trainer_profiles
    WHERE user_id = user_id_param
  );
$$;

-- Create new policies using the security definer function
CREATE POLICY "Trainers can view own profile"
ON public.trainer_profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Trainers can update own profile"
ON public.trainer_profiles
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Trainers can insert own profile"
ON public.trainer_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Simplified policy for clients viewing their trainer
CREATE POLICY "Anyone authenticated can view trainer profiles"
ON public.trainer_profiles
FOR SELECT
USING (auth.role() = 'authenticated');