export type BookingStatus = "confirmed" | "cancelled"

export interface Booking {
  id: string
  student_name: string
  student_number: string
  student_email: string
  booking_date: string
  time_slot: string
  duration_hours: number
  reason: string
  status: BookingStatus
  cancellation_token: string
  created_at: string
}

export const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
]

export const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "ssa-staff-2024"
