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

  // Check if date is blocked
  const { data: blocked } = await supabase
    .from("blocked_dates")
    .select("id, reason")
    .eq("date", date)
    .maybeSingle()

  if (blocked) {
    return NextResponse.json({
      availableSlots: [],
      bookedSlots: [],
      blocked: true,
      blockedReason: blocked.reason || "This date is unavailable.",
    })
  }

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
