-- Allow clients to view their trainer's profile
CREATE POLICY "Clients can view their trainer's profile"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT tp.user_id
    FROM trainer_profiles tp
    JOIN client_profiles cp ON cp.trainer_id = tp.id
    WHERE cp.user_id = auth.uid()
  )
);