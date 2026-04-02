import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET all bookings for staff
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get("password")

  if (password !== (process.env.STAFF_PASSWORD || "SSA2025")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("booking_date", { ascending: true })
    .order("time_slot", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookings: data })
}

// PATCH - staff update booking
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { password, id, ...updates } = body

  if (password !== (process.env.STAFF_PASSWORD || "SSA2025")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ booking: data })
}

// DELETE - staff delete booking
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { password, id } = body

  if (password !== (process.env.STAFF_PASSWORD || "SSA2025")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("bookings").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
