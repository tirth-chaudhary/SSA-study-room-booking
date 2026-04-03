"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
  XCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

interface BookingInfo {
  id: string
  student_name: string
  booking_date: string
  time_slot: string
  status: string
}

function CancelPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get("bookingid") ?? ""

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setNotFound(true)
      setLoading(false)
      return
    }
    fetch(`/api/cancel?bookingid=${token}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data?.booking) {
          setBooking(data.booking)
          if (data.booking.status === "cancelled") {
            setCancelled(true)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    setCancelling(true)
    setError(null)
    const res = await fetch(`/api/cancel?bookingid=${token}`, { method: "POST" })
    const data = await res.json()
    setCancelling(false)
    if (!res.ok) {
      setError(data.error || "Failed to cancel booking.")
    } else {
      setCancelled(true)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "#f4f7fb" }}>
      {/* Header */}
      <header style={{ background: "#1e63ad" }} className="text-white">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
              <Image src="/images/ssa-logo.png" alt="SSA Logo" width={32} height={32} className="object-contain" priority />
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-widest font-medium">
                Science Students&apos; Association
              </p>
              <h1 className="text-base font-bold text-white leading-tight">
                Cancel Booking
              </h1>
            </div>
          </div>
          {/* Gold accent bar */}
        </div>
        <div style={{ height: 4, background: "#fbb315" }} />
      </header>

      <div className="max-w-md mx-auto px-4 py-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white animate-pulse" />
            ))}
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center text-center py-10 space-y-3">
            <AlertTriangle size={40} style={{ color: "#5a7299" }} />
            <h2 className="text-lg font-bold" style={{ color: "#0f1f3d" }}>Booking Not Found</h2>
            <p className="text-sm max-w-xs" style={{ color: "#5a7299" }}>
              This cancellation link is invalid or has already been used.
            </p>
            <Link href="/">
              <Button variant="outline" className="mt-3">Return to Booking Page</Button>
            </Link>
          </div>
        ) : cancelled ? (
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#0f1f3d" }}>Booking Cancelled</h2>
            <p className="text-sm max-w-xs" style={{ color: "#5a7299" }}>
              Your booking has been cancelled successfully. A confirmation has been sent to your email.
            </p>
            {booking && (
              <div className="rounded-xl border w-full mt-2 overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
                <div className="px-4 py-2.5 border-b" style={{ background: "#e8f0fb", borderColor: "#d0ddf0" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5a7299" }}>
                    Cancelled Booking
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: "#e8f0fb" }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar size={14} style={{ color: "#5a7299" }} className="shrink-0" />
                    <span className="text-sm line-through" style={{ color: "#5a7299" }}>
                      {format(new Date(booking.booking_date + "T12:00:00"), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Clock size={14} style={{ color: "#5a7299" }} className="shrink-0" />
                    <span className="text-sm line-through" style={{ color: "#5a7299" }}>
                      {booking.time_slot}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Link href="/">
              <Button className="mt-2 text-white" style={{ background: "#1e63ad" }}>
                Make a New Booking
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center space-y-2 py-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#0f1f3d" }}>Cancel Your Booking</h2>
              <p className="text-sm" style={{ color: "#5a7299" }}>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
            </div>

            {booking && (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
                <div className="px-4 py-3" style={{ background: "#1e63ad" }}>
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Booking Details</p>
                </div>
                <div className="divide-y bg-white" style={{ borderColor: "#e8f0fb" }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <User size={14} style={{ color: "#1e63ad" }} className="shrink-0" />
                    <div>
                      <p className="text-xs" style={{ color: "#5a7299" }}>Name</p>
                      <p className="text-sm font-medium" style={{ color: "#0f1f3d" }}>{booking.student_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar size={14} style={{ color: "#1e63ad" }} className="shrink-0" />
                    <div>
                      <p className="text-xs" style={{ color: "#5a7299" }}>Date</p>
                      <p className="text-sm font-medium" style={{ color: "#0f1f3d" }}>
                        {format(new Date(booking.booking_date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Clock size={14} style={{ color: "#1e63ad" }} className="shrink-0" />
                    <div>
                      <p className="text-xs" style={{ color: "#5a7299" }}>Time</p>
                      <p className="text-sm font-medium" style={{ color: "#0f1f3d" }}>
                        {booking.time_slot} &mdash; 1 hour
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">Keep Booking</Button>
              </Link>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f4f7fb" }}>
        <div className="space-y-3 w-full max-w-md px-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-white animate-pulse" />)}
        </div>
      </div>
    }>
      <CancelPageInner />
    </Suspense>
  )
}
