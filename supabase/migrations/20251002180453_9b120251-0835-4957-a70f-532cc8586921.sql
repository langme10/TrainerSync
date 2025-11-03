-- Create a function to check if a time slot is available
-- This runs with SECURITY DEFINER so it can check all bookings regardless of RLS
CREATE OR REPLACE FUNCTION public.is_slot_available(
  p_trainer_id UUID,
  p_booking_date DATE,
  p_start_time TIME
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false if there's an existing booking for this slot
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE trainer_id = p_trainer_id
      AND booking_date = p_booking_date
      AND start_time = p_start_time
      AND status IN ('pending', 'confirmed')
  );
END;
$$;

-- Create a function to get occupied slots for a trainer
-- Returns only the date/time info, not client details
CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_trainer_id UUID)
RETURNS TABLE(booking_date DATE, start_time TIME, end_time TIME)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.booking_date, b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.trainer_id = p_trainer_id
    AND b.status IN ('pending', 'confirmed');
END;
$$;