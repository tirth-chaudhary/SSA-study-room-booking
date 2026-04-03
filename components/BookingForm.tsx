"use client"

import { useState, useEffect } from "react"
import { format, addDays, isBefore, startOfDay, isWeekend, isAfter } from "date-fns"
import { MAX_BOOKING_DAYS_AHEAD } from "@/lib/types"
import {
  Calendar,
  Clock,
  User,
  Mail,
  Hash,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import BookingConfirmation from "./BookingConfirmation"

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function BookingForm() {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState({
    student_name: "",
    student_number: "",
    student_email: "",
    reason: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Record<string, unknown> | null>(null)

  // Client-side only state - initialize in effect to avoid hydration mismatch
  const [today, setToday] = useState<Date | null>(null)
  const [viewYear, setViewYear] = useState<number>(2025)
  const [viewMonth, setViewMonth] = useState<number>(0)

  // Initialize date only on client side
  useEffect(() => {
    const now = startOfDay(new Date())
    setToday(now)
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setMounted(true)
  }, [])

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    setAvailableSlots([])
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    fetch(`/api/availability?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableSlots(data.availableSlots || [])
        setBookedSlots(data.bookedSlots || [])
      })
      .finally(() => setLoadingSlots(false))
  }, [selectedDate])

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleDayClick = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    const maxDate = addDays(today, MAX_BOOKING_DAYS_AHEAD)
    if (isBefore(date, today) || isAfter(date, maxDate) || isWeekend(date)) return
    setSelectedDate(date)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) {
      setError("Please select a date and time slot.")
      return
    }
    if (!form.student_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.")
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        time_slot: selectedSlot,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.")
    } else {
      setConfirmedBooking(data.booking)
    }
  }

  if (confirmedBooking) {
    return (
      <BookingConfirmation
        booking={confirmedBooking as {
          id: string
          booking_number?: number
          student_name: string
          student_email: string
          booking_date: string
          time_slot: string
          reason: string
          cancellation_token: string
        }}
      />
    )
  }

  // Show loading skeleton until client-side hydration completes
  if (!mounted || !today) {
    return (
      <div className="space-y-6">
        <div className="h-16 rounded-lg bg-muted animate-pulse" />
        <div className="h-80 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const maxDate = addDays(today, MAX_BOOKING_DAYS_AHEAD)

  return (
    <div className="space-y-6">
      {/* Notice banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: "#fffbea", border: "1px solid #fbb315" }}
      >
        <AlertTriangle className="mt-0.5 shrink-0" size={16} style={{ color: "#d9970c" }} />
        <p className="text-sm leading-relaxed" style={{ color: "#7a5000" }}>
          <strong>Reminder:</strong> Please do not leave a key inside the office &mdash; you may get locked out.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1 – Pick a date */}
        <section>
          <h2 className="text-base font-semibold text-primary flex items-center gap-2 mb-3">
            <Calendar size={16} />
            Step 1 &mdash; Choose a Date
          </h2>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Calendar header */}
            <div
              className="flex items-center justify-between px-4 py-3 text-white"
              style={{ background: "#1e63ad" }}
            >
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-sm">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {/* Day labels */}
            <div className="grid grid-cols-7 bg-muted border-b border-border">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 p-2 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const date = new Date(viewYear, viewMonth, day)
                const isPast = isBefore(date, today)
                const isFutureTooFar = isAfter(date, maxDate)
                const isWknd = isWeekend(date)
                const isDisabled = isPast || isFutureTooFar || isWknd
                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === viewMonth &&
                  selectedDate.getFullYear() === viewYear
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === viewMonth &&
                  today.getFullYear() === viewYear

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isDisabled && handleDayClick(day)}
                    disabled={isDisabled === true}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm rounded-lg font-medium transition-all",
                      isSelected
                        ? "text-white shadow-md scale-105"
                        : isToday && !isDisabled
                        ? "border-2 font-bold"
                        : isDisabled
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "hover:bg-[#e8f0fb] text-foreground cursor-pointer"
                    )}
                    style={
                      isSelected
                        ? { background: "#1e63ad" }
                        : isToday && !isDisabled
                        ? { borderColor: "#1e63ad", color: "#1e63ad" }
                        : {}
                    }
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            {selectedDate && (
              <div className="px-4 pb-3 text-center">
                <span className="text-sm font-semibold" style={{ color: "#1e63ad" }}>
                  Selected: {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Weekdays only &bull; Bookings available up to 1 week in advance &bull; Hours: 8:30 AM - 4:30 PM
          </p>
        </section>

        {/* Step 2 – Pick a time slot */}
        {selectedDate && (
          <section>
            <h2 className="text-base font-semibold text-primary flex items-center gap-2 mb-3">
              <Clock size={16} />
              Step 2 &mdash; Choose a Time Slot
            </h2>
            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : availableSlots.length === 0 && bookedSlots.length > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-destructive font-medium">
                  All time slots for this day are booked.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please select another date.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "py-2 px-1 text-sm rounded-lg border font-medium transition-all",
                      selectedSlot === slot
                        ? "text-white border-transparent shadow-md scale-105"
                        : "bg-white border-[#d0ddf0] text-foreground hover:border-[#1e63ad] hover:bg-[#e8f0fb]"
                    )}
                    style={selectedSlot === slot ? { background: "#1e63ad", borderColor: "#1e63ad" } : {}}
                  >
                    {slot}
                  </button>
                ))}
                {bookedSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled
                    className="py-2 px-1 text-sm rounded-lg border border-border bg-muted text-muted-foreground/50 cursor-not-allowed line-through"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 3 – Student details */}
        {selectedDate && selectedSlot && (
          <section className="space-y-4">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <User size={16} />
              Step 3 &mdash; Your Details
            </h2>

            <div className="space-y-3">
              <div>
                <Label htmlFor="student_name" className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <User size={13} className="text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="student_name"
                  required
                  placeholder="Jane Smith"
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="student_number" className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <Hash size={13} className="text-muted-foreground" />
                  Student Number
                </Label>
                <Input
                  id="student_number"
                  required
                  placeholder="e.g. 123456789"
                  value={form.student_number}
                  onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="student_email" className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <Mail size={13} className="text-muted-foreground" />
                  Student Email
                </Label>
                <Input
                  id="student_email"
                  type="email"
                  required
                  placeholder="jane@university.ca"
                  value={form.student_email}
                  onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your booking confirmation will be sent here.
                </p>
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <FileText size={13} className="text-muted-foreground" />
                  Reason for Booking
                </Label>
                <Textarea
                  id="reason"
                  required
                  placeholder="e.g. Group project meeting, exam study session, tutoring..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5">
                <AlertTriangle size={15} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Booking summary */}
            <div
              className="rounded-xl p-4 space-y-1.5"
              style={{ background: "#e8f0fb", border: "1px solid #c2d5f0" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#1e63ad" }}>
                Booking Summary
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar size={13} style={{ color: "#1e63ad" }} className="shrink-0" />
                <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock size={13} style={{ color: "#1e63ad" }} className="shrink-0" />
                <span>{selectedSlot} &mdash; 1 hour</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-semibold h-11 text-white shadow-md hover:opacity-90 transition-opacity"
              style={{ background: "#1e63ad" }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Confirming Booking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Confirm Booking
                </span>
              )}
            </Button>
          </section>
        )}
      </form>
    </div>
  )
}
