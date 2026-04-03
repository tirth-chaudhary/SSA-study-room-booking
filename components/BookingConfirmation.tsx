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
import Image from "next/image"

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
      ? `${window.location.origin}/cancel?bookingid=${booking.cancellation_token}`
      : `/cancel?bookingid=${booking.cancellation_token}`

  const displayId = booking.booking_number
    ? `#${booking.booking_number}`
    : `#${booking.id.slice(0, 6).toUpperCase()}`

  const handleCopy = () => {
    navigator.clipboard.writeText(cancelUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    setCancelling(true)
    setCancelError(null)
    const res = await fetch(`/api/bookings/cancel/${booking.cancellation_token}`, {
      method: "POST",
    })
    const data = await res.json()
    setCancelling(false)
    
    // Handle standardized API response
    if (!data.success) {
      setCancelError(data.error || "Failed to cancel booking.")
    } else {
      setCancelled(true)
    }
  }

  if (cancelled) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
          <XCircle className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground">Booking Cancelled</h2>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          Your booking for{" "}
          {format(new Date(booking.booking_date + "T12:00:00"), "MMMM d, yyyy")} at{" "}
          {booking.time_slot} has been cancelled.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-2"
          style={{ background: "#1e63ad", color: "#fff" }}
        >
          Make a New Booking
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="flex flex-col items-center py-5 text-center space-y-2">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-1 shadow-md"
          style={{ background: "linear-gradient(135deg, #1e63ad 0%, #2d7dd2 100%)" }}
        >
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#0f1f3d" }}>
          Booking Confirmed!
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#5a7299" }}>
          A confirmation email has been sent to{" "}
          <strong style={{ color: "#0f1f3d" }}>{booking.student_email}</strong>.
        </p>
      </div>

      {/* Spam/Junk Alert */}
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "#fff8e1", border: "1px solid #fbb315" }}
      >
        <span className="text-lg leading-none mt-0.5 shrink-0">📧</span>
        <div className="text-sm" style={{ color: "#7a5000" }}>
          <p className="font-semibold mb-1">Check your inbox</p>
          <p>Find the booking confirmation email and show it at the SSA window to get the room key. For first-time users, please check your Junk/Spam folder.</p>
        </div>
      </div>

      {/* Booking reference badge */}
      <div
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl mx-auto w-fit"
        style={{ background: "#e8f0fb", border: "1px solid #c2d5f0" }}
      >
        <Hash size={14} style={{ color: "#1e63ad" }} />
        <span className="font-bold text-lg tracking-wide" style={{ color: "#1e63ad" }}>
          Booking {displayId}
        </span>
      </div>

      {/* Booking details card */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#d0ddf0" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#1e63ad" }}>
          <div
            className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
          >
            <Image src="/images/ssa-logo.png" alt="SSA" width={18} height={18} className="object-contain" />
          </div>
          <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            Booking Details
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: "#e8f0fb" }}>
          {[
            { icon: <Calendar size={15} />, label: "Date", value: format(new Date(booking.booking_date + "T12:00:00"), "EEEE, MMMM d, yyyy") },
            { icon: <Clock size={15} />, label: "Time", value: `${booking.time_slot} — 1 hour` },
            { icon: <User size={15} />, label: "Name", value: booking.student_name },
            { icon: <Mail size={15} />, label: "Email", value: booking.student_email },
            { icon: <FileText size={15} />, label: "Reason", value: booking.reason },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <span style={{ color: "#1e63ad" }}>{icon}</span>
              <div>
                <p className="text-xs" style={{ color: "#5a7299" }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: "#0f1f3d" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key reminder */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: "#fffbea", border: "1px solid #fbb315" }}
      >
        <span className="text-lg leading-none mt-0.5">⚠️</span>
        <p className="text-sm leading-relaxed" style={{ color: "#7a5000" }}>
          <strong>Important Reminder:</strong>{" "}Please do not leave the study room key inside the office — you may get locked out.
        </p>
      </div>

      {/* Cancel section */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: "#f4f7fb", border: "1px solid #d0ddf0" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0f1f3d" }}>Need to Cancel?</p>
          <p className="text-xs mt-0.5" style={{ color: "#5a7299" }}>
            Your cancellation link was emailed to you. You can also use the button below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-xs font-mono truncate"
            style={{ background: "#e8f0fb", color: "#5a7299" }}
          >
            {cancelUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "#1e63ad" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {cancelError && (
          <p className="text-xs text-red-600">{cancelError}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          {cancelling ? "Cancelling..." : "Cancel This Booking"}
        </Button>
      </div>

      <Button
        className="w-full font-semibold"
        style={{ background: "#1e63ad", color: "#fff" }}
        onClick={() => window.location.reload()}
      >
        Make Another Booking
      </Button>
    </div>
  )
}
