-- Remove the foreign key constraint if it exists
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey;

-- Recreate it to reference profiles.id instead
ALTER TABLE bookings 
  ADD CONSTRAINT bookings_cancelled_by_fkey 
  FOREIGN KEY (cancelled_by) 
  REFERENCES profiles(id);