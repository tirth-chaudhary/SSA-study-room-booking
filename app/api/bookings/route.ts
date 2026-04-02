import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    student_name,
    student_number,
    student_email,
    booking_date,
    time_slot,
    reason,
  } = body

  if (
    !student_name ||
    !student_number ||
    !student_email ||
    !booking_date ||
    !time_slot ||
    !reason
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Enforce 1-hour-per-day cap per student
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("student_number", student_number)
    .eq("booking_date", booking_date)
    .eq("status", "confirmed")

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        error:
          "You already have a booking on this date. Only 1 booking per day is allowed.",
      },
      { status: 409 }
    )
  }

  // Check time slot is still available
  const { data: slotTaken } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_date", booking_date)
    .eq("time_slot", time_slot)
    .eq("status", "confirmed")

  if (slotTaken && slotTaken.length > 0) {
    return NextResponse.json(
      { error: "This time slot has just been taken. Please choose another." },
      { status: 409 }
    )
  }

  const { data: booking, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send confirmation email via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        req.headers.get("origin") ||
        "http://localhost:3000"
      const cancelUrl = `${origin}/cancel/${booking.cancellation_token}`

      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "SSA Study Room <noreply@tirthchaudhary.com>",
        to: student_email,
        subject: `Booking Confirmed – SSA Study Room on ${booking_date} at ${time_slot}`,
        html: buildConfirmationEmail({
          student_name,
          booking_date,
          time_slot,
          reason,
          booking_id: booking.id,
          cancelUrl,
        }),
      })
    } catch {
      // Email failure is non-blocking — booking is still created
    }
  }

  return NextResponse.json({ booking }, { status: 201 })
}

function buildConfirmationEmail({
  student_name,
  booking_date,
  time_slot,
  reason,
  booking_id,
  cancelUrl,
}: {
  student_name: string
  booking_date: string
  time_slot: string
  reason: string
  booking_id: string
  cancelUrl: string
}) {
  // Format date nicely: "2025-04-07" -> "Monday, April 7, 2025"
  const formatted = new Date(booking_date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  )

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background-color:#eef2f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1e2d5a;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 4px;color:#a8b8e8;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Science Students Association</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Study Room Booking</h1>
            </td>
          </tr>

          <!-- Green success banner -->
          <tr>
            <td style="background:#22c55e;padding:12px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;">&#10003; &nbsp;Your booking is confirmed!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1e2d5a;">Hi <strong>${student_name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#444;line-height:1.6;">
                Your SSA Study Room booking has been confirmed. Please arrive on time and remember to follow room guidelines.
              </p>

              <!-- Booking details card -->
              <table role="presentation" width="100%" style="background:#f0f4ff;border-radius:8px;border-left:4px solid #2e5bcc;padding:0;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #dce6ff;">
                          <span style="color:#666;font-size:13px;">Date</span><br>
                          <strong style="color:#1e2d5a;font-size:15px;">${formatted}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #dce6ff;">
                          <span style="color:#666;font-size:13px;">Time</span><br>
                          <strong style="color:#1e2d5a;font-size:15px;">${time_slot} &ndash; 1 hour</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #dce6ff;">
                          <span style="color:#666;font-size:13px;">Purpose</span><br>
                          <span style="color:#1e2d5a;font-size:15px;">${reason}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#666;font-size:13px;">Booking Reference</span><br>
                          <span style="color:#999;font-size:12px;font-family:monospace;">${booking_id}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Key reminder warning -->
              <table role="presentation" width="100%" style="background:#fffbeb;border:1px solid #f5c842;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;color:#92400e;font-size:14px;line-height:1.5;">
                      <strong>&#9888;&nbsp; Important Reminder:</strong><br>
                      Please do <strong>not</strong> leave a key inside the office &mdash; you may get locked out.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Cancel button -->
              <p style="margin:0 0 12px;font-size:14px;color:#444;">Need to cancel? Use the button below any time before your booking:</p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:6px;background:#dc2626;">
                    <a href="${cancelUrl}" style="display:inline-block;padding:11px 24px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:6px;">
                      Cancel My Booking
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fc;padding:18px 32px;border-top:1px solid #e8edf5;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">
                This email was sent by the SSA Study Room Booking System.<br>
                If you have questions, please contact the Science Students Association directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
