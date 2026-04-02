"use client"

import { useState, useEffect, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  LogOut,
  Pencil,
  Trash2,
  X,
  Check,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Booking } from "@/lib/types"

interface StaffDashboardProps {
  password: string
  onLogout: () => void
}

type ViewMode = "calendar" | "list"

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export default function StaffDashboard({ password, onLogout }: StaffDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>("calendar")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editForm, setEditForm] = useState<Partial<Booking>>({})
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "cancelled">("all")

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/staff/bookings?password=${encodeURIComponent(password)}`)
    const data = await res.json()
    setBookings(data.bookings || [])
    setLoading(false)
  }, [password])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)

  const bookingsForDay = (day: Date) =>
    bookings.filter(
      (b) =>
        b.booking_date === format(day, "yyyy-MM-dd") && b.status === "confirmed"
    )

  const allBookingsForDay = (day: Date) =>
    bookings.filter((b) => b.booking_date === format(day, "yyyy-MM-dd"))

  const selectedDayBookings = selectedDay ? allBookingsForDay(selectedDay) : []

  // Stats
  const totalConfirmed = bookings.filter((b) => b.status === "confirmed").length
  const totalCancelled = bookings.filter((b) => b.status === "cancelled").length
  const todayBookings = bookings.filter(
    (b) =>
      b.booking_date === format(new Date(), "yyyy-MM-dd") &&
      b.status === "confirmed"
  ).length

  // Filtered list view
  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      searchQuery === "" ||
      b.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.student_number.includes(searchQuery) ||
      b.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.booking_date.includes(searchQuery)
    const matchStatus = filterStatus === "all" || b.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking)
    setEditForm({
      student_name: booking.student_name,
      student_number: booking.student_number,
      student_email: booking.student_email,
      booking_date: booking.booking_date,
      time_slot: booking.time_slot,
      reason: booking.reason,
      status: booking.status,
    })
  }

  const handleSave = async () => {
    if (!editingBooking) return
    setSaving(true)
    const res = await fetch("/api/staff/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id: editingBooking.id, ...editForm }),
    })
    setSaving(false)
    if (res.ok) {
      setEditingBooking(null)
      fetchBookings()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this booking? This cannot be undone.")) return
    await fetch("/api/staff/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id }),
    })
    fetchBookings()
  }

  const handleCancelOverride = async (booking: Booking) => {
    if (!confirm(`Cancel booking for ${booking.student_name}?`)) return
    await fetch("/api/staff/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id: booking.id, status: "cancelled" }),
    })
    fetchBookings()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="bg-[var(--ssa-navy)] text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--ssa-blue)]">
              <FlaskConical size={17} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest leading-none">SSA</p>
              <h1 className="text-sm font-bold text-white">Staff Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              <button
                onClick={() => setView("calendar")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "calendar"
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Calendar size={13} /> Calendar
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  view === "list"
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                <List size={13} /> List
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
            >
              <LogOut size={13} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConfirmed}</p>
              <p className="text-xs text-muted-foreground">Total Active</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayBookings}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <XCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </div>

        {/* Calendar view */}
        {view === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Calendar */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-semibold text-sm">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-muted border-b border-border">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 p-2 gap-1">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map((day) => {
                  const count = bookingsForDay(day).length
                  const isSelected = selectedDay && isSameDay(day, selectedDay)
                  const today = isToday(day)
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() =>
                        setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)
                      }
                      className={cn(
                        "relative aspect-square flex flex-col items-center justify-center text-sm rounded-lg transition-all",
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-md"
                          : today
                          ? "border-2 border-accent text-accent font-semibold"
                          : "hover:bg-secondary text-foreground"
                      )}
                    >
                      <span className="font-medium leading-none">{format(day, "d")}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "mt-0.5 text-[9px] font-bold leading-none",
                            isSelected ? "text-accent-foreground/80" : "text-accent"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Day detail panel */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden h-fit">
              {selectedDay ? (
                <>
                  <div className="bg-primary px-4 py-3">
                    <p className="text-xs text-primary-foreground/60 uppercase tracking-wide font-semibold">
                      {format(selectedDay, "EEEE")}
                    </p>
                    <p className="text-sm font-bold text-primary-foreground">
                      {format(selectedDay, "MMMM d, yyyy")}
                    </p>
                  </div>
                  {selectedDayBookings.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">No bookings this day.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border max-h-[460px] overflow-y-auto">
                      {selectedDayBookings.map((b) => (
                        <div key={b.id} className="px-4 py-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">
                              {b.time_slot}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full border",
                                STATUS_COLORS[b.status]
                              )}
                            >
                              {b.status}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{b.student_name}</p>
                          <p className="text-xs text-muted-foreground">{b.student_email}</p>
                          <p className="text-xs text-muted-foreground italic">{b.reason}</p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleEdit(b)}
                              className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                              <Pencil size={11} /> Edit
                            </button>
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => handleCancelOverride(b)}
                                className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                              >
                                <XCircle size={11} /> Cancel
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="text-xs text-destructive hover:underline flex items-center gap-1"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Calendar size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click a day to view bookings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-muted/40">
              <div className="relative flex-1 min-w-40">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, number, email, date..."
                  className="pl-8 h-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(["all", "confirmed", "cancelled"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                      filterStatus === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No bookings found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date", "Time", "Student", "Student #", "Email", "Reason", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap font-medium text-foreground">
                          {format(new Date(b.booking_date + "T12:00:00"), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-foreground">
                          {b.time_slot}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-foreground">
                          {b.student_name}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground font-mono text-xs">
                          {b.student_number}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {b.student_email}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-[180px] truncate">
                          {b.reason}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full border",
                              STATUS_COLORS[b.status]
                            )}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(b)}
                              className="text-accent hover:text-accent/80"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => handleCancelOverride(b)}
                                className="text-orange-500 hover:text-orange-400"
                                title="Cancel"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Edit Booking</h3>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Full Name</Label>
                  <Input
                    value={editForm.student_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, student_name: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Student Number</Label>
                  <Input
                    value={editForm.student_number || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, student_number: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Email</Label>
                <Input
                  value={editForm.student_email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, student_email: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Date</Label>
                  <Input
                    type="date"
                    value={editForm.booking_date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, booking_date: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Status</Label>
                  <select
                    value={editForm.status || "confirmed"}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as "confirmed" | "cancelled",
                      })
                    }
                    className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                  >
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Reason</Label>
                <Input
                  value={editForm.reason || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingBooking(null)}
                className="gap-1.5"
              >
                <X size={13} /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {saving ? (
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
