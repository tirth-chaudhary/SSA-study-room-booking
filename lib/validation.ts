import { z } from "zod"

/**
 * Validation schemas for API requests
 * Standardized responses: { success: true, data: ... } or { success: false, error: "..." }
 */

export const createBookingSchema = z.object({
  student_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  
  student_number: z
    .string()
    .transform((val) => val.replace(/^0+/, "")) // Strip leading zeros
    .refine((val) => /^\d{7}$/.test(val), "Student number must be exactly 7 digits"),
  
  student_email: z
    .string()
    .email("Invalid email format")
    .refine(
      (email) => email.toLowerCase().endsWith("@myumanitoba.ca"),
      "Only University of Manitoba student emails are permitted (@myumanitoba.ca)"
    ),
  
  booking_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  
  time_slot: z
    .string()
    .min(1, "Time slot is required"),
  
  reason: z
    .string()
    .max(500, "Reason must be less than 500 characters")
    .optional()
    .or(z.literal("")),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

// Standardized API response types
export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }
