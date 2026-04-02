"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { format } from "date-fns"
import {
  XCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  FlaskConical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BookingInfo {
  id: string
  student_name: string
  booking_date: string
  time_slot: string
  status: string
}

export default function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/cancel/${token}`)
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
    const res = await fetch(`/api/cancel/${token}`, { method: "POST" })
    const data = await res.json()
    setCancelling(false)
    if (!res.ok) {
      setError(data.error || "Failed to cancel booking.")
    } else {
      setCancelled(true)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-[var(--ssa-navy)] text-white py-4 px-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--ssa-blue)]">
            <FlaskConical size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest font-medium">
              Science Students Association
            </p>
            <h1 className="text-base font-bold text-white leading-tight">
              Cancel Booking
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center text-center py-10 space-y-3">
            <AlertTriangle size={40} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Booking Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              This cancellation link is invalid or has already been used.
            </p>
            <Link href="/">
              <Button variant="outline" className="mt-3">
                Return to Booking Page
              </Button>
            </Link>
          </div>
        ) : cancelled ? (
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Booking Cancelled</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your booking has been cancelled successfully. A confirmation has been sent to your email.
            </p>
            {booking && (
              <div className="rounded-xl border border-border bg-card w-full mt-2 overflow-hidden">
                <div className="bg-primary/5 px-4 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Cancelled Booking
                  </p>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground line-through text-muted-foreground">
                      {format(new Date(booking.booking_date + "T12:00:00"), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Clock size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground line-through">
                      {booking.time_slot}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Link href="/">
              <Button className="mt-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                Make a New Booking
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center space-y-2 py-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle size={28} className="text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Cancel Your Booking</h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
            </div>

            {booking && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-primary px-4 py-3">
                  <p className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wide">
                    Booking Details
                  </p>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <User size={14} className="text-accent shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium text-foreground">{booking.student_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar size={14} className="text-accent shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(booking.booking_date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Clock size={14} className="text-accent shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium text-foreground">
                        {booking.time_slot} &mdash; 1 hour
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5">
                <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Keep Booking
                </Button>
              </Link>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
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
