import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("*")
    .eq("cancellation_token", token)
    .single()

  if (findError || !booking) {
    return NextResponse.json(
      { error: "Booking not found or already cancelled." },
      { status: 404 }
    )
  }

  if (booking.status === "cancelled") {
    return NextResponse.json(
      { error: "This booking has already been cancelled." },
      { status: 409 }
    )
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Send cancellation confirmation email
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "SSA Study Room <noreply@yourdomain.com>",
          to: booking.student_email,
          subject: `Booking Cancelled – SSA Study Room on ${booking.booking_date}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fc; padding: 24px; border-radius: 8px;">
              <div style="background: #1e2d5a; border-radius: 8px 8px 0 0; padding: 24px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px;">Booking Cancelled</h1>
                <p style="color: #a8b8e8; margin: 6px 0 0;">Science Students Association</p>
              </div>
              <div style="background: #fff; padding: 28px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #1e2d5a;">Hi <strong>${booking.student_name}</strong>,</p>
                <p style="color: #444; line-height: 1.6;">Your booking has been successfully cancelled.</p>
                <div style="background: #f9f0f0; border-left: 4px solid #dc3545; padding: 16px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; color: #555;">Date: <strong>${booking.booking_date}</strong></p>
                  <p style="margin: 6px 0 0; color: #555;">Time: <strong>${booking.time_slot}</strong></p>
                </div>
                <p style="color: #888; font-size: 13px;">If you need to rebook, please visit the SSA Study Room booking page.</p>
              </div>
            </div>
          `,
        }),
      })
    } catch {
      // Email failure is non-blocking
    }
  }

  return NextResponse.json({ success: true, booking })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, student_name, booking_date, time_slot, status")
    .eq("cancellation_token", token)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 })
  }

  return NextResponse.json({ booking })
}
