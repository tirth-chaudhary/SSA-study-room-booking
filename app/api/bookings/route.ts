import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createBookingSchema, type ApiResponse } from "@/lib/validation"
import { Resend } from "resend"

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()

    // Validate with Zod
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Validation failed"
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }

    const { student_name, student_number, student_email, booking_date, time_slot, reason } =
      validation.data

    const supabase = createAdminClient()

    // Enforce 1-hour-per-day cap per student
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("student_number", student_number)
      .eq("booking_date", booking_date)
      .eq("status", "confirmed")

    if (existingError) {
      return NextResponse.json(
        { success: false, error: "Database error checking availability" },
        { status: 500 }
      )
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a booking on this date. Only 1 booking per day is allowed.",
        },
        { status: 409 }
      )
    }

    // Check if time slot is available
    const { data: slotTaken, error: slotError } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_date", booking_date)
      .eq("time_slot", time_slot)
      .eq("status", "confirmed")

    if (slotError) {
      return NextResponse.json(
        { success: false, error: "Database error checking slot availability" },
        { status: 500 }
      )
    }

    if (slotTaken && slotTaken.length > 0) {
      return NextResponse.json(
        { success: false, error: "This time slot has just been taken. Please choose another." },
        { status: 409 }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        student_name,
        student_number,
        student_email,
        booking_date,
        time_slot,
        duration_hours: 1,
        reason,
        status: "confirmed",
      })
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json(
        { success: false, error: "Failed to create booking" },
        { status: 500 }
      )
    }

    // Send confirmation email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const origin =
          process.env.NEXT_PUBLIC_APP_URL ||
          req.headers.get("origin") ||
          "http://localhost:3000"
        const cancelUrl = `${origin}/api/bookings/cancel/${booking.cancellation_token}`
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail =
          process.env.RESEND_FROM_EMAIL || "SSA Study Room <onboarding@resend.dev>"
        await resend.emails.send({
          from: fromEmail,
          to: student_email,
          subject: `Booking Confirmed – SSA Study Room on ${booking_date} at ${time_slot}`,
          html: buildConfirmationEmail({
            student_name,
            booking_date,
            time_slot,
            reason,
            booking_id: booking.id,
            booking_number: booking.booking_number,
            cancelUrl,
          }),
        })
      } catch {
        // Email failure is non-blocking — booking is still created
      }
    }

    return NextResponse.json(
      { success: true, data: booking },
      { status: 201 }
    )
  } catch (error) {
    console.error("[bookings API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

function buildConfirmationEmail({
  student_name,
  booking_date,
  time_slot,
  reason,
  booking_id,
  booking_number,
  cancelUrl,
}: {
  student_name: string
  booking_date: string
  time_slot: string
  reason: string
  booking_id: string
  booking_number?: number
  cancelUrl: string
}) {
  const formatted = new Date(booking_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const displayRef = booking_number ? `#${booking_number}` : `#${booking_id.slice(0, 6).toUpperCase()}`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,99,173,0.10);">

          <!-- Gold top bar -->
          <tr><td style="background:#fbb315;height:5px;font-size:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="background:#1e63ad;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Science Students&apos; Association &bull; University of Manitoba</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Study Room Booking</h1>
            </td>
          </tr>

          <!-- Success banner -->
          <tr>
            <td style="background:#22c55e;padding:12px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;">&#10003;&nbsp; Your booking is confirmed!</p>
            </td>
          </tr>

          <!-- Booking ref badge -->
          <tr>
            <td style="padding:20px 32px 0;text-align:center;">
              <span style="display:inline-block;background:#e8f0fb;border:1px solid #c2d5f0;border-radius:999px;padding:6px 20px;font-size:18px;font-weight:700;color:#1e63ad;font-family:monospace;">
                Booking ${displayRef}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#0f1f3d;">Hi <strong>${student_name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#5a7299;line-height:1.7;">
                Your SSA Study Room booking has been confirmed. Please arrive on time and follow room guidelines.
              </p>

              <!-- Details card -->
              <table role="presentation" width="100%" style="background:#e8f0fb;border-radius:12px;border-left:4px solid #1e63ad;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding:8px 0;border-bottom:1px solid #c2d5f0;">
                        <span style="color:#5a7299;font-size:12px;">Date</span><br>
                        <strong style="color:#0f1f3d;font-size:15px;">${formatted}</strong>
                      </td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #c2d5f0;">
                        <span style="color:#5a7299;font-size:12px;">Time</span><br>
                        <strong style="color:#0f1f3d;font-size:15px;">${time_slot} &ndash; 1 hour</strong>
                      </td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #c2d5f0;">
                        <span style="color:#5a7299;font-size:12px;">Purpose</span><br>
                        <span style="color:#0f1f3d;font-size:15px;">${reason}</span>
                      </td></tr>
                      <tr><td style="padding:8px 0;">
                        <span style="color:#5a7299;font-size:12px;">Booking Reference</span><br>
                        <span style="color:#1e63ad;font-size:16px;font-weight:700;font-family:monospace;">${displayRef}</span>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Key reminder -->
              <table role="presentation" width="100%" style="background:#fffbea;border:1px solid #fbb315;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;color:#7a5000;font-size:14px;line-height:1.6;">
                      <strong>&#9888;&nbsp; Important Reminder:</strong><br>
                      Please do <strong>not</strong> leave a key inside the office &mdash; you may get locked out.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Cancel button -->
              <p style="margin:0 0 12px;font-size:14px;color:#5a7299;">Need to cancel? Use the button below:</p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:8px;background:#dc2626;">
                    <a href="${cancelUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Cancel My Booking
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f7fb;padding:16px 32px;border-top:1px solid #e8f0fb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5a7299;">
                Sent by the SSA Study Room Booking System &bull; University of Manitoba<br>
                Questions? Contact the Science Students&apos; Association directly.
              </p>
            </td>
          </tr>
          <!-- Gold bottom bar -->
          <tr><td style="background:#fbb315;height:4px;font-size:0;">&nbsp;</td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
