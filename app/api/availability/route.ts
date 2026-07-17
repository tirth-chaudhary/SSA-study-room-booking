import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TIME_SLOTS } from "@/lib/types"

// University of Manitoba is in the America/Winnipeg (Central) timezone.
const TIMEZONE = "America/Winnipeg"

// Returns the current date (yyyy-MM-dd) and minutes-since-midnight in Winnipeg time.
function getLocalNow() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)

  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value

  let hour = parseInt(map.hour, 10)
  if (hour === 24) hour = 0 // some environments report midnight as 24

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    minutes: hour * 60 + parseInt(map.minute, 10),
  }
}

// Parses a slot label like "9:30 AM" into minutes-since-midnight.
function slotToMinutes(slot: string): number {
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return 0
  let hour = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const ap = m[3].toUpperCase()
  if (ap === "PM" && hour !== 12) hour += 12
  if (ap === "AM" && hour === 12) hour = 0
  return hour * 60 + min
}

// Removes slots whose start time has already passed, but only when the
// requested date is today (in Winnipeg time). Future dates are unaffected.
function filterPastSlots(slots: string[], date: string): string[] {
  const { dateStr, minutes } = getLocalNow()
  if (date !== dateStr) return slots
  return slots.filter((s) => slotToMinutes(s) > minutes)
}

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
    const availableSlots = filterPastSlots(
      TIME_SLOTS.filter((s) => !allUnavailable.includes(s)),
      date
    )

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
  const availableSlots = filterPastSlots(
    TIME_SLOTS.filter((s) => !bookedSlots.includes(s)),
    date
  )

  return NextResponse.json({ availableSlots, bookedSlots, blocked: false })
}
