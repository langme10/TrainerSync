-- Drop existing problematic policies
DROP POLICY IF EXISTS "Trainers can view own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can update own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can insert own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Clients can view their trainer profile" ON public.trainer_profiles;

-- Create security definer function to check if user is trainer
CREATE OR REPLACE FUNCTION public.is_trainer_owner(trainer_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.trainer_profiles
    WHERE id = trainer_profile_id
    AND user_id = auth.uid()
  );
$$;

-- Create new policies using the security definer function
CREATE POLICY "Trainers can view own profile"
  ON public.trainer_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Trainers can update own profile"
  ON public.trainer_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Trainers can insert own profile"
  ON public.trainer_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clients can view their trainer profile"
  ON public.trainer_profiles FOR SELECT
  USING (
    id IN (
      SELECT trainer_id FROM public.client_profiles
      WHERE user_id = auth.uid()
      AND trainer_id IS NOT NULL
    )
  );