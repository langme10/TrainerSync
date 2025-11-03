-- Create table for trainer availability slots
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE, -- For one-off slots
  buffer_minutes INTEGER DEFAULT 0 CHECK (buffer_minutes >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create table for bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.trainer_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  availability_slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  client_notes TEXT,
  trainer_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.profiles(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for availability_slots
CREATE POLICY "Trainers can manage own availability"
  ON public.availability_slots FOR ALL
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their trainer's availability"
  ON public.availability_slots FOR SELECT
  USING (
    trainer_id IN (
      SELECT trainer_id FROM public.client_profiles
      WHERE user_id = auth.uid()
      AND trainer_id IS NOT NULL
    )
  );

-- RLS Policies for bookings
CREATE POLICY "Trainers can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.client_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.client_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can cancel their bookings"
  ON public.bookings FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.client_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can update their bookings"
  ON public.bookings FOR UPDATE
  USING (
    trainer_id IN (
      SELECT id FROM public.trainer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Create function to check for booking conflicts
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_trainer_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE trainer_id = p_trainer_id
      AND booking_date = p_booking_date
      AND status IN ('pending', 'confirmed')
      AND (id IS DISTINCT FROM p_exclude_booking_id)
      AND (
        (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
      )
  );
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_availability_slots_trainer_id ON public.availability_slots(trainer_id);
CREATE INDEX idx_availability_slots_day_of_week ON public.availability_slots(day_of_week);
CREATE INDEX idx_availability_slots_specific_date ON public.availability_slots(specific_date);
CREATE INDEX idx_bookings_trainer_id ON public.bookings(trainer_id);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Create triggers for updated_at
CREATE TRIGGER update_availability_slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();