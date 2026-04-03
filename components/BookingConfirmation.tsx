"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  CheckCircle2,
  Calendar,
  Clock,
  Mail,
  Hash,
  User,
  FileText,
  Copy,
  Check,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface BookingConfirmationProps {
  booking: {
    id: string
    booking_number?: number
    student_name: string
    student_email: string
    booking_date: string
    time_slot: string
    reason: string
    cancellation_token: string
  }
}

export default function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const cancelUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/cancel/${booking.cancellation_token}`
      : `/cancel/${booking.cancellation_token}`

  const handleCopy = () => {
    navigator.clipboard.writeText(cancelUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    setCancelling(true)
    setCancelError(null)
    const res = await fetch(`/api/cancel/${booking.cancellation_token}`, {
      method: "POST",
    })
    const data = await res.json()
    setCancelling(false)
    if (!res.ok) {
      setCancelError(data.error || "Failed to cancel booking.")
    } else {
      setCancelled(true)
    }
  }

  if (cancelled) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="text-destructive" size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Booking Cancelled</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your booking for {format(new Date(booking.booking_date + "T12:00:00"), "MMMM d, yyyy")} at{" "}
          {booking.time_slot} has been cancelled. A confirmation has been sent to your email.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Make a New Booking
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="flex flex-col items-center py-6 text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-1">
          <CheckCircle2 className="text-green-600" size={34} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Booking Confirmed!</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your study room has been reserved. A confirmation email has been sent to{" "}
          <strong className="text-foreground">{booking.student_email}</strong>.
        </p>
      </div>

      {/* Booking details card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-primary px-4 py-3">
          <p className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-wide">
            Booking Details
          </p>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Calendar size={15} className="text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(booking.booking_date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Clock size={15} className="text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-medium text-foreground">
                {booking.time_slot} &mdash; 1 hour
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <User size={15} className="text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium text-foreground">{booking.student_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail size={15} className="text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{booking.student_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <FileText size={15} className="text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Reason</p>
              <p className="text-sm font-medium text-foreground">{booking.reason}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3">
            <Hash size={15} className="text-accent shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Booking ID</p>
              <p className="text-xs font-mono text-muted-foreground break-all">{booking.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel link */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Need to Cancel?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Save this link to cancel your booking at any time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate">
            {cancelUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {cancelError && (
          <p className="text-xs text-destructive">{cancelError}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          {cancelling ? "Cancelling..." : "Cancel This Booking"}
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => window.location.reload()}
      >
        Make Another Booking
      </Button>
    </div>
  )
}
