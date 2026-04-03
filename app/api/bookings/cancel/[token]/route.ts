import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type ApiResponse } from "@/lib/validation"
import { Resend } from "resend"

// Next.js 16: params must be awaited
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing booking token" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, student_name, booking_date, time_slot, status, booking_number")
      .eq("cancellation_token", token)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error("[cancel GET] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing booking token" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find booking by cancellation token
    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("*")
      .eq("cancellation_token", token)
      .single()

    if (findError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or already cancelled" },
        { status: 404 }
      )
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "This booking has already been cancelled" },
        { status: 409 }
      )
    }

    // Cancel the booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to cancel booking" },
        { status: 500 }
      )
    }

    // Send cancellation email
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail =
          process.env.RESEND_FROM_EMAIL || "SSA Study Room <onboarding@resend.dev>"
        
        await resend.emails.send({
          from: fromEmail,
          to: booking.student_email,
          subject: `Booking Cancelled – SSA Study Room on ${booking.booking_date}`,
          html: buildCancellationEmail({
            student_name: booking.student_name,
            booking_date: booking.booking_date,
            time_slot: booking.time_slot,
            booking_number: booking.booking_number,
          }),
        })
      } catch {
        // Email failure is non-blocking
      }
    }

    return NextResponse.json(
      { success: true, data: { booking_id: booking.id, status: "cancelled" } }
    )
  } catch (error) {
    console.error("[cancel POST] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

function buildCancellationEmail({
  student_name,
  booking_date,
  time_slot,
  booking_number,
}: {
  student_name: string
  booking_date: string
  time_slot: string
  booking_number?: number
}) {
  const displayRef = booking_number ? `#${booking_number}` : "your booking"

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Booking Cancelled</title></head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,99,173,0.10);">
          <tr><td style="background:#fbb315;height:5px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="background:#1e63ad;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Science Students&apos; Association &bull; University of Manitoba</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Booking Cancelled</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#fef2f2;padding:12px 32px;text-align:center;border-bottom:2px solid #dc2626;">
              <p style="margin:0;color:#7f1d1d;font-size:14px;font-weight:600;">Your booking has been cancelled</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#0f1f3d;">Hi <strong>${student_name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#5a7299;line-height:1.7;">
                Your SSA Study Room booking has been successfully cancelled. The time slot is now available for other students.
              </p>
              <table role="presentation" width="100%" style="background:#fef2f2;border-radius:12px;border-left:4px solid #dc2626;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding:8px 0;border-bottom:1px solid #fee2e2;">
                        <span style="color:#7f1d1d;font-size:12px;">Booking Reference</span><br>
                        <span style="color:#0f1f3d;font-size:16px;font-weight:700;font-family:monospace;">${displayRef}</span>
                      </td></tr>
                      <tr><td style="padding:8px 0;border-bottom:1px solid #fee2e2;">
                        <span style="color:#7f1d1d;font-size:12px;">Date</span><br>
                        <strong style="color:#0f1f3d;font-size:15px;">${booking_date}</strong>
                      </td></tr>
                      <tr><td style="padding:8px 0;">
                        <span style="color:#7f1d1d;font-size:12px;">Time</span><br>
                        <strong style="color:#0f1f3d;font-size:15px;">${time_slot}</strong>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color:#5a7299;font-size:13px;">If you need to rebook, please visit the SSA Study Room booking page.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f7fb;padding:16px 32px;border-top:1px solid #e8f0fb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5a7299;">
                Sent by the SSA Study Room Booking System &bull; University of Manitoba<br>
                Questions? Contact the Science Students&apos; Association directly.
              </p>
            </td>
          </tr>
          <tr><td style="background:#fbb315;height:4px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
