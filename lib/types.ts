export type BookingStatus = "confirmed" | "cancelled"

export interface Booking {
  id: string
  booking_number: number
  student_name: string
  student_number: string
  student_email: string
  booking_date: string
  time_slot: string
  duration_hours: number
  reason?: string | null
  status: BookingStatus
  cancellation_token: string
  created_at: string
}

export interface BlockedDate {
  id: string
  date: string
  time_slot?: string | null
  reason?: string | null
  created_by?: string | null
  created_at: string
}

// Working hours: 9:30 AM - 4:30 PM, last slot at 3:30 PM (1 hour duration)
export const TIME_SLOTS = [
  "9:30 AM",
  "10:30 AM",
  "11:30 AM",
  "12:30 PM",
  "1:30 PM",
  "2:30 PM",
  "3:30 PM",
]

export const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "SSA2025"

// Max booking window: 7 days in advance
export const MAX_BOOKING_DAYS_AHEAD = 7
