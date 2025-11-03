-- Allow trainers to view their clients' profiles
CREATE POLICY "Trainers can view their clients' profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT cp.user_id 
    FROM public.client_profiles cp
    INNER JOIN public.trainer_profiles tp ON cp.trainer_id = tp.id
    WHERE tp.user_id = auth.uid()
  )
);