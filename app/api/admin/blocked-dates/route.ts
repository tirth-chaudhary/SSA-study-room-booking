import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import { TIME_SLOTS } from "@/lib/types"

function authenticate(req: NextRequest): boolean {
  const auth = req.headers.get("authorization")
  const password = auth?.replace("Bearer ", "") ?? ""
  return password === (process.env.STAFF_PASSWORD || "SSA2025")
}

const blockDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  // null/undefined = block entire day, a valid time slot string = block that slot only
  time_slot: z
    .string()
    .refine((v) => TIME_SLOTS.includes(v), { message: "Invalid time slot" })
    .nullable()
    .optional(),
  reason: z.string().max(200).optional().or(z.literal("")),
})

// GET — list all blocked dates/slots
export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blocked_dates")
    .select("*")
    .order("date", { ascending: true })
    .order("time_slot", { ascending: true, nullsFirst: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
}

// POST — block a date or specific time slot
export async function POST(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const body = await req.json()
  const validation = blockDateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: validation.error.errors[0]?.message || "Validation failed" },
      { status: 400 }
    )
  }
  const { date, time_slot, reason } = validation.data
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("blocked_dates")
    .insert({
      date,
      time_slot: time_slot ?? null,
      reason: reason || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      const what = time_slot ? `${time_slot} on ${date}` : date
      return NextResponse.json(
        { success: false, error: `"${what}" is already blocked.` },
        { status: 409 }
      )
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data }, { status: 201 })
}

// DELETE — unblock by id (?id=...)
export async function DELETE(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ success: false, error: "id is required" }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { error } = await supabase.from("blocked_dates").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
