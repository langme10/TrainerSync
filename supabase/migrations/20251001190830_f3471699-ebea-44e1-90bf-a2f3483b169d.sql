-- Create exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  equipment TEXT,
  instructions TEXT,
  video_url TEXT,
  is_template BOOLEAN DEFAULT false, -- Global templates vs trainer-specific
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create program templates table
CREATE TABLE public.program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workouts table (days in a program)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_template_id UUID REFERENCES public.program_templates(id) ON DELETE CASCADE,
  client_program_id UUID, -- For assigned programs
  day_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workout sets table
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_order INTEGER NOT NULL,
  target_reps TEXT,
  target_weight NUMERIC,
  target_rpe INTEGER CHECK (target_rpe >= 1 AND target_rpe <= 10),
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create client programs table (assigned programs)
CREATE TABLE public.client_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.program_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workout logs table (client completion tracking)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create set logs table (individual set tracking)
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  workout_set_id UUID NOT NULL REFERENCES public.workout_sets(id) ON DELETE CASCADE,
  actual_reps INTEGER,
  actual_weight NUMERIC,
  actual_rpe INTEGER CHECK (actual_rpe >= 1 AND actual_rpe <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create meal plan templates table
CREATE TABLE public.meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fats INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_template_id UUID REFERENCES public.meal_plan_templates(id) ON DELETE CASCADE,
  client_meal_plan_id UUID, -- For assigned meal plans
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fats INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create client meal plans table (assigned meal plans)
CREATE TABLE public.client_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.meal_plan_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises
CREATE POLICY "Trainers can manage own exercises"
  ON public.exercises FOR ALL
  USING (trainer_id IN (
    SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Clients can view their trainer's exercises"
  ON public.exercises FOR SELECT
  USING (trainer_id IN (
    SELECT trainer_id FROM public.client_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for program_templates
CREATE POLICY "Trainers can manage own program templates"
  ON public.program_templates FOR ALL
  USING (trainer_id IN (
    SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for workouts
CREATE POLICY "Trainers can manage workouts in their programs"
  ON public.workouts FOR ALL
  USING (
    program_template_id IN (
      SELECT id FROM public.program_templates 
      WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
    )
    OR
    client_program_id IN (
      SELECT id FROM public.client_programs
      WHERE client_id IN (
        SELECT id FROM public.client_profiles
        WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Clients can view their assigned workouts"
  ON public.workouts FOR SELECT
  USING (
    client_program_id IN (
      SELECT id FROM public.client_programs WHERE client_id IN (
        SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for workout_sets
CREATE POLICY "Trainers can manage sets in their workouts"
  ON public.workout_sets FOR ALL
  USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE program_template_id IN (
        SELECT id FROM public.program_templates 
        WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Clients can view their assigned sets"
  ON public.workout_sets FOR SELECT
  USING (
    workout_id IN (
      SELECT id FROM public.workouts WHERE client_program_id IN (
        SELECT id FROM public.client_programs WHERE client_id IN (
          SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for client_programs
CREATE POLICY "Trainers can manage their clients' programs"
  ON public.client_programs FOR ALL
  USING (
    client_id IN (
      SELECT id FROM public.client_profiles
      WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Clients can view own programs"
  ON public.client_programs FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for workout_logs
CREATE POLICY "Clients can manage own workout logs"
  ON public.workout_logs FOR ALL
  USING (
    client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Trainers can view their clients' logs"
  ON public.workout_logs FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.client_profiles
      WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for set_logs
CREATE POLICY "Clients can manage own set logs"
  ON public.set_logs FOR ALL
  USING (
    workout_log_id IN (
      SELECT id FROM public.workout_logs WHERE client_id IN (
        SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can view their clients' set logs"
  ON public.set_logs FOR SELECT
  USING (
    workout_log_id IN (
      SELECT id FROM public.workout_logs WHERE client_id IN (
        SELECT id FROM public.client_profiles
        WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
      )
    )
  );

-- RLS Policies for meal_plan_templates
CREATE POLICY "Trainers can manage own meal plan templates"
  ON public.meal_plan_templates FOR ALL
  USING (trainer_id IN (
    SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for meals
CREATE POLICY "Trainers can manage meals in their templates"
  ON public.meals FOR ALL
  USING (
    meal_plan_template_id IN (
      SELECT id FROM public.meal_plan_templates 
      WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
    )
    OR
    client_meal_plan_id IN (
      SELECT id FROM public.client_meal_plans
      WHERE client_id IN (
        SELECT id FROM public.client_profiles
        WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Clients can view their assigned meals"
  ON public.meals FOR SELECT
  USING (
    client_meal_plan_id IN (
      SELECT id FROM public.client_meal_plans WHERE client_id IN (
        SELECT id FROM public.client_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for client_meal_plans
CREATE POLICY "Trainers can manage their clients' meal plans"
  ON public.client_meal_plans FOR ALL
  USING (
    client_id IN (
      SELECT id FROM public.client_profiles
      WHERE trainer_id IN (SELECT id FROM public.trainer_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Clients can view own meal plans"
  ON public.client_meal_plans FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())
  );

-- Create indexes
CREATE INDEX idx_exercises_trainer_id ON public.exercises(trainer_id);
CREATE INDEX idx_program_templates_trainer_id ON public.program_templates(trainer_id);
CREATE INDEX idx_workouts_program_template_id ON public.workouts(program_template_id);
CREATE INDEX idx_workouts_client_program_id ON public.workouts(client_program_id);
CREATE INDEX idx_workout_sets_workout_id ON public.workout_sets(workout_id);
CREATE INDEX idx_client_programs_client_id ON public.client_programs(client_id);
CREATE INDEX idx_workout_logs_client_id ON public.workout_logs(client_id);
CREATE INDEX idx_meal_plan_templates_trainer_id ON public.meal_plan_templates(trainer_id);
CREATE INDEX idx_meals_meal_plan_template_id ON public.meals(meal_plan_template_id);
CREATE INDEX idx_client_meal_plans_client_id ON public.client_meal_plans(client_id);

-- Create triggers for updated_at
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_templates_updated_at
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at
  BEFORE UPDATE ON public.workout_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_programs_updated_at
  BEFORE UPDATE ON public.client_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meal_plan_templates_updated_at
  BEFORE UPDATE ON public.meal_plan_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_meal_plans_updated_at
  BEFORE UPDATE ON public.client_meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();