import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type ApiResponse } from "@/lib/validation"

// Helper: Extract and validate Authorization Bearer token
function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7) // Remove "Bearer " prefix
}

// Helper: Verify auth token against STAFF_PASSWORD
function verifyAuth(token: string): boolean {
  const staffPassword = process.env.STAFF_PASSWORD || "SSA2025"
  return token === staffPassword
}

// GET /api/admin/bookings - Retrieve all bookings
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const token = getAuthToken(req)
    if (!token || !verifyAuth(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing authentication" },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("time_slot", { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: bookings })
  } catch (error) {
    console.error("[admin GET] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
