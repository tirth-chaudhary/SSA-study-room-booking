-- Add a human-readable numeric booking ID
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_number SERIAL;
CREATE INDEX IF NOT EXISTS bookings_booking_number_idx ON public.bookings (booking_number);
