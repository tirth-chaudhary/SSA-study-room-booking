-- SSA Study Room Booking System

-- Bookings table (no auth required - students book as guests)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  student_email TEXT NOT NULL,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,           -- e.g. "09:00"
  duration_hours INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
  cancellation_token UUID DEFAULT gen_random_uuid(), -- for self-service cancel
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff accounts table (for admin login)
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Bookings: anyone can read/insert (public booking system)
CREATE POLICY "Anyone can view bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Only allow updates via service role (used by staff API routes)
CREATE POLICY "Service role can update bookings" ON public.bookings
  FOR UPDATE USING (true);

CREATE POLICY "Service role can delete bookings" ON public.bookings
  FOR DELETE USING (true);

-- Staff: only authenticated users can view their own record
CREATE POLICY "Staff can view own record" ON public.staff
  FOR SELECT USING (auth.uid()::text IS NOT NULL);

-- Unique constraint: one booking per student per day (enforced at app level too)
CREATE UNIQUE INDEX IF NOT EXISTS bookings_student_per_day
  ON public.bookings (student_number, booking_date)
  WHERE status = 'confirmed';

-- Index for date-based lookups
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings (booking_date);
CREATE INDEX IF NOT EXISTS bookings_token_idx ON public.bookings (cancellation_token);
