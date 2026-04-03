# API Refactoring Summary

## Overview
Complete refactoring of the SSA Study Room Booking API with strict validation, standardized responses, improved security, and consolidated routing.

---

## 1. File Structure Changes

### Deleted (Old Routes)
- `app/api/cancel/route.ts` — Removed, consolidated
- `app/api/cancel/[token]/route.ts` — Removed, consolidated
- `app/api/staff/bookings/route.ts` — Removed, migrated to admin namespace

### Created (New Routes)
- `lib/validation.ts` — Zod validation schemas with standardized response types
- `app/api/bookings/cancel/[token]/route.ts` — Consolidated cancellation endpoint
- `app/api/admin/bookings/route.ts` — Admin GET all bookings with auth header
- `app/api/admin/bookings/[id]/route.ts` — Admin PATCH & DELETE with dynamic routing
- `app/api/bookings/route.ts` — Refactored with validation & standardized responses

### Updated
- `components/BookingForm.tsx` — Updated to handle new response format
- `app/cancel/page.tsx` — Updated to new cancel API path & response format
- `components/BookingConfirmation.tsx` — Updated cancel URL & fetch format
- `components/StaffDashboard.tsx` — Updated to use auth header & admin routes

---

## 2. API Routing Map

### Student Bookings
```
POST /api/bookings
  Input: CreateBookingInput (validated with Zod)
  Response: { success: true, data: Booking } or { success: false, error: string }
  Validation:
    - student_number: 7 digits (strips leading zeros)
    - student_email: Must end with @myumanitoba.ca
    - All fields required
    - 1 booking per student per day enforced
    - Real-time slot availability checked
```

### Cancellation (Consolidated)
```
GET /api/bookings/cancel/[token]
  Purpose: Fetch booking details before cancellation
  Response: { success: true, data: BookingInfo } or { success: false, error: string }

POST /api/bookings/cancel/[token]
  Purpose: Confirm and process cancellation
  Response: { success: true, data: { booking_id, status } } or { success: false, error: string }
```

### Admin Routes (Auth Header Required)
```
GET /api/admin/bookings
  Auth: Authorization: Bearer <STAFF_PASSWORD>
  Response: { success: true, data: Booking[] } or { success: false, error: string }

PATCH /api/admin/bookings/[id]
  Auth: Authorization: Bearer <STAFF_PASSWORD>
  Body: Partial<Booking> fields to update
  Response: { success: true, data: Booking } or { success: false, error: string }

DELETE /api/admin/bookings/[id]
  Auth: Authorization: Bearer <STAFF_PASSWORD>
  Response: { success: true, data: { id, deleted: true } } or { success: false, error: string }
```

---

## 3. Validation Rules

### Student Number
- Input: String (accepts leading zeros)
- Processing: Leading zeros stripped
- Validation: Must result in exactly 7 digits
- Error message: "Student number must be exactly 7 digits"

### Student Email
- Must end with `@myumanitoba.ca`
- Any other domain rejected
- Error message: "Only University of Manitoba student emails are permitted (@myumanitoba.ca)"

### Booking Constraints
- 1 booking per student per day (enforced in database)
- Real-time slot availability checked to prevent double-booking
- Bookings available up to 7 days in advance
- Weekdays only (Monday-Friday)

---

## 4. Security Improvements

### Before
- Admin endpoints checked `password` query param or in request body (plain text)
- Validation was ad-hoc and scattered across components
- No standardized error messages

### After
- Admin endpoints use `Authorization: Bearer <STAFF_PASSWORD>` header
- All validation centralized in `/lib/validation.ts` using Zod
- Standardized error responses with specific, actionable messages
- All responses follow consistent format: `{ success, data/error }`

### Auth Header Format
```typescript
Authorization: Bearer SSA2025  // or environment variable STAFF_PASSWORD
```

---

## 5. Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Booking or array of bookings
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Specific, user-friendly error message"
}
```

---

## 6. Updated Component Behavior

### BookingForm
- Now handles `{ success, data }` response format
- Server validation errors (e.g., email domain) displayed in red callout
- Zod validation errors caught and displayed

### BookingConfirmation
- Cancel URL now uses new path: `/cancel?bookingid=<token>`
- Fetch calls updated to `/api/bookings/cancel/<token>`
- Inline cancel button updated with new API path

### Cancel Page (`/cancel/page.tsx`)
- Reads token from query param: `?bookingid=<token>`
- API calls now hit `/api/bookings/cancel/<token>`
- Updated to handle standardized response format

### StaffDashboard
- All admin API calls now use `Authorization` header
- Routes changed from `/api/staff/bookings` → `/api/admin/bookings`
- Dynamic routes for PATCH/DELETE: `/api/admin/bookings/[id]`
- Updated response handling for `{ success, data }`

---

## 7. Migration Checklist

- [x] Zod schema created with strict validation rules
- [x] Bookings API refactored with validation & standardized responses
- [x] Cancellation consolidated to `/api/bookings/cancel/[token]`
- [x] Staff routes migrated to `/api/admin` with auth headers
- [x] Dynamic admin routes for PATCH/DELETE
- [x] BookingForm updated for new response format
- [x] Cancel page updated for query param & new API
- [x] BookingConfirmation updated for new paths
- [x] StaffDashboard updated for auth headers & routes

---

## 8. Key Behaviors Maintained

✓ 1-hour-per-day booking cap per student  
✓ Real-time availability checking (prevent double-booking)  
✓ Resend email integration for confirmations & cancellations  
✓ Booking reference numbers & cancellation tokens  
✓ Weekday-only, 7-day advance booking window  
✓ All time slot constraints (8:30 AM - 4:30 PM, 1-hour slots)

---

## 9. Environment Variables

Ensure these are set in `.env.local`:

```
STAFF_PASSWORD=SSA2025
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=<your_key>
RESEND_FROM_EMAIL=SSA Study Room <onboarding@resend.dev>
```

---

## 10. Testing the New API

### Test booking creation with validation
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Jane Smith",
    "student_number": "007953676",  # Leading zero will be stripped
    "student_email": "jane@myumanitoba.ca",
    "booking_date": "2025-12-15",
    "time_slot": "2:30 PM",
    "reason": "Group study session"
  }'
```

### Test admin auth
```bash
curl -X GET http://localhost:3000/api/admin/bookings \
  -H "Authorization: Bearer SSA2025"
```

### Test invalid email
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "John Doe",
    "student_number": "1234567",
    "student_email": "john@gmail.com",  # Will be rejected
    "booking_date": "2025-12-15",
    "time_slot": "2:30 PM",
    "reason": "Study"
  }'
# Response: { success: false, error: "Only University of Manitoba student emails are permitted (@myumanitoba.ca)" }
```

---

## Notes
- All email functionality (confirmations, cancellations) remains intact via Resend
- The cancellation token in the database is the source of truth for cancellation links
- Admin operations now properly secured with Bearer token authentication
- Validation is centralized and can be easily extended in `/lib/validation.ts`
