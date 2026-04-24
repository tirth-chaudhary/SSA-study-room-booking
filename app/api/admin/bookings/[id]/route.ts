import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type ApiResponse } from "@/lib/validation"

// Helper: Extract and validate Authorization Bearer token
function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}

// Helper: Verify auth token against STAFF_PASSWORD
function verifyAuth(token: string): boolean {
  const staffPassword = process.env.STAFF_PASSWORD || "SSA2025"
  return token === staffPassword
}

// PATCH /api/admin/bookings/[id] - Update booking
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const token = getAuthToken(req)
    if (!token || !verifyAuth(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing authentication" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()

    // Remove auth token from update payload if present
    const { ...updates } = body

    const supabase = createAdminClient()
    const { data: booking, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[admin PATCH] Supabase error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to update booking" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error) {
    console.error("[admin PATCH] Error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
