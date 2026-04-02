"use client"

import { useState, useEffect } from "react"
import { format, addDays, isBefore, startOfDay, isWeekend } from "date-fns"
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
  const today = startOfDay(new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
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
    if (isBefore(date, today) || isWeekend(date)) return
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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const maxDate = addDays(today, 60)

  return (
    <div className="space-y-6">
      {/* Notice banner */}
      <div className="flex items-start gap-3 bg-[var(--ssa-gold)]/15 border border-[var(--ssa-gold)]/40 rounded-lg px-4 py-3">
        <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
        <p className="text-sm text-amber-800 leading-relaxed">
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
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
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
                const isFutureTooFar = isBefore(maxDate, date)
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
                    disabled={isDisabled}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm rounded-lg font-medium transition-all",
                      isSelected
                        ? "bg-accent text-accent-foreground shadow-md scale-105"
                        : isToday && !isDisabled
                        ? "border-2 border-accent text-accent"
                        : isDisabled
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "hover:bg-secondary text-foreground cursor-pointer"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            {selectedDate && (
              <div className="px-4 pb-3 text-center">
                <span className="text-sm font-medium text-accent">
                  Selected: {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Weekdays only &bull; Bookings available up to 60 days in advance
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
                        ? "bg-accent text-accent-foreground border-accent shadow-md scale-105"
                        : "bg-card border-border text-foreground hover:border-accent hover:bg-secondary"
                    )}
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
            <div className="rounded-lg bg-[var(--ssa-light-blue)] border border-accent/20 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                Booking Summary
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar size={13} className="text-accent shrink-0" />
                <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock size={13} className="text-accent shrink-0" />
                <span>{selectedSlot} &mdash; 1 hour</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-11"
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
