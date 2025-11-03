-- Allow clients to view program templates assigned to them
CREATE POLICY "Clients can view their assigned program templates"
ON public.program_templates
FOR SELECT
USING (
  id IN (
    SELECT template_id
    FROM public.client_programs
    WHERE client_id IN (
      SELECT id
      FROM public.client_profiles
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow clients to view meal plan templates assigned to them
CREATE POLICY "Clients can view their assigned meal plan templates"
ON public.meal_plan_templates
FOR SELECT
USING (
  id IN (
    SELECT template_id
    FROM public.client_meal_plans
    WHERE client_id IN (
      SELECT id
      FROM public.client_profiles
      WHERE user_id = auth.uid()
    )
  )
);