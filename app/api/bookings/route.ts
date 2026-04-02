import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

  // Send confirmation email via Resend (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin")}/cancel/${booking.cancellation_token}`
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "SSA Study Room <noreply@yourdomain.com>",
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
        }),
      })
    } catch {
      // Email failure is non-blocking
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
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fc; padding: 24px; border-radius: 8px;">
    <div style="background: #1e2d5a; border-radius: 8px 8px 0 0; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">SSA Study Room Booking</h1>
      <p style="color: #a8b8e8; margin: 6px 0 0;">Science Students Association</p>
    </div>
    <div style="background: #fff; padding: 28px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 16px; color: #1e2d5a; margin-top: 0;">Hi <strong>${student_name}</strong>,</p>
      <p style="color: #444; line-height: 1.6;">Your study room booking has been <strong style="color: #2e5bcc;">confirmed</strong>! Here are your booking details:</p>
      <div style="background: #f0f4ff; border-left: 4px solid #2e5bcc; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #555; width: 40%;">Date</td><td style="padding: 6px 0; color: #1e2d5a; font-weight: bold;">${booking_date}</td></tr>
          <tr><td style="padding: 6px 0; color: #555;">Time</td><td style="padding: 6px 0; color: #1e2d5a; font-weight: bold;">${time_slot} (1 hour)</td></tr>
          <tr><td style="padding: 6px 0; color: #555;">Purpose</td><td style="padding: 6px 0; color: #1e2d5a;">${reason}</td></tr>
          <tr><td style="padding: 6px 0; color: #555;">Booking ID</td><td style="padding: 6px 0; color: #888; font-size: 13px;">${booking_id}</td></tr>
        </table>
      </div>
      <div style="background: #fff8e6; border: 1px solid #f5c842; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;"><strong>Reminder:</strong> Please do not leave a key inside the office — you may get locked out.</p>
      </div>
      <p style="color: #444; line-height: 1.6;">Need to cancel? You can cancel your booking at any time by clicking the button below:</p>
      <a href="${cancelUrl}" style="display: inline-block; background: #dc3545; color: #fff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-size: 14px; font-weight: bold; margin: 8px 0;">Cancel Booking</a>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">If you have any issues, please contact the SSA directly.</p>
    </div>
  </div>
  `
}
