import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TIME_SLOTS } from "@/lib/types"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch all blocks for this date (full-day and slot-specific)
  const { data: blocks } = await supabase
    .from("blocked_dates")
    .select("id, time_slot, reason")
    .eq("date", date)

  if (blocks && blocks.length > 0) {
    // Full-day block = a row where time_slot IS NULL
    const fullDayBlock = blocks.find((b) => b.time_slot === null)
    if (fullDayBlock) {
      return NextResponse.json({
        availableSlots: [],
        bookedSlots: [],
        blocked: true,
        blockedReason: fullDayBlock.reason || "This date is unavailable.",
      })
    }

    // Only specific slots are blocked — collect them
    const staffBlockedSlots = blocks.map((b) => b.time_slot as string)

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("time_slot")
      .eq("booking_date", date)
      .eq("status", "confirmed")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const studentBookedSlots = bookings.map((b) => b.time_slot)
    const allUnavailable = Array.from(new Set([...studentBookedSlots, ...staffBlockedSlots]))
    const availableSlots = TIME_SLOTS.filter((s) => !allUnavailable.includes(s))

    return NextResponse.json({
      availableSlots,
      bookedSlots: studentBookedSlots,
      staffBlockedSlots,
      blocked: false,
    })
  }

  // No blocks at all — just check student bookings
  const { data, error } = await supabase
    .from("bookings")
    .select("time_slot")
    .eq("booking_date", date)
    .eq("status", "confirmed")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const bookedSlots = data.map((b) => b.time_slot)
  const availableSlots = TIME_SLOTS.filter((s) => !bookedSlots.includes(s))

  return NextResponse.json({ availableSlots, bookedSlots, blocked: false })
}
