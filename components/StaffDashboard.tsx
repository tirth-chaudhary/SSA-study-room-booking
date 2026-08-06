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
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  LogOut,
  Pencil,
  X,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  CalendarDays,
  LayoutList,
  Ban,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Booking, BlockedDate } from "@/lib/types"
import { TIME_SLOTS } from "@/lib/types"
import Image from "next/image"

interface StaffDashboardProps {
  password: string
  onLogout: () => void
}

type ViewMode = "month" | "week" | "day" | "list" | "blocked"

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export default function StaffDashboard({ password, onLogout }: StaffDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editForm, setEditForm] = useState<Partial<Booking>>({})
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "confirmed" | "cancelled">("all")
  const [listDate, setListDate] = useState(new Date())

  // Blocked dates state
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)
  const [blockForm, setBlockForm] = useState({ date: "", time_slot: "", reason: "" })
  const [blockError, setBlockError] = useState<string | null>(null)
  const [blockSaving, setBlockSaving] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/bookings", {
      headers: {
        Authorization: `Bearer ${password}`,
      },
    })
    const data = await res.json()
    setBookings(data.success && data.data ? data.data : [])
    setLoading(false)
  }, [password])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const fetchBlockedDates = useCallback(async () => {
    setLoadingBlocked(true)
    const res = await fetch("/api/admin/blocked-dates", {
      headers: { Authorization: `Bearer ${password}` },
    })
    const data = await res.json()
    setBlockedDates(data.success && data.data ? data.data : [])
    setLoadingBlocked(false)
  }, [password])

  useEffect(() => {
    fetchBlockedDates()
  }, [fetchBlockedDates])

  const handleBlockDate = async () => {
    if (!blockForm.date) {
      setBlockError("Please select a date to block.")
      return
    }
    setBlockSaving(true)
    setBlockError(null)
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({
        date: blockForm.date,
        time_slot: blockForm.time_slot || null,
        reason: blockForm.reason,
      }),
    })
    const data = await res.json()
    setBlockSaving(false)
    if (!data.success) {
      setBlockError(data.error || "Failed to block date.")
    } else {
      setBlockForm({ date: "", time_slot: "", reason: "" })
      fetchBlockedDates()
    }
  }

  const handleUnblockDate = async (id: string) => {
    if (!confirm("Remove this blocked date? Students will be able to book it again.")) return
    await fetch(`/api/admin/blocked-dates?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${password}` },
    })
    fetchBlockedDates()
  }

  const bookingsForDate = (date: Date) =>
    bookings.filter((b) => b.booking_date === format(date, "yyyy-MM-dd") && b.status === "confirmed")

  const allBookingsForDate = (date: Date) =>
    bookings.filter((b) => b.booking_date === format(date, "yyyy-MM-dd"))

  // Filtered list view — scoped to selected listDate
  const listDateStr = format(listDate, "yyyy-MM-dd")
  const filteredBookings = bookings.filter((b) => {
    const matchDate = b.booking_date === listDateStr
    const matchSearch =
      searchQuery === "" ||
      b.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.student_number.includes(searchQuery) ||
      b.student_email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = filterStatus === "all" || b.status === filterStatus
    return matchDate && matchSearch && matchStatus
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
    const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(editForm),
    })
    setSaving(false)
    if (res.ok) {
      setEditingBooking(null)
      fetchBookings()
    }
  }

  const handleCancelOverride = async (booking: Booking) => {
    if (!confirm(`Cancel booking for ${booking.student_name}?`)) return
    await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    })
    fetchBookings()
  }

  const bookingDisplayId = (b: Booking) =>
    b.booking_number ? `#${b.booking_number}` : `#${b.id.slice(0, 6).toUpperCase()}`

  // --- Navigation helpers ---
  const prevPeriod = () => {
    if (view === "month") setCurrentDate((d) => subMonths(d, 1))
    else if (view === "week") setCurrentDate((d) => subWeeks(d, 1))
    else if (view === "day") setCurrentDate((d) => subDays(d, 1))
  }
  const nextPeriod = () => {
    if (view === "month") setCurrentDate((d) => addMonths(d, 1))
    else if (view === "week") setCurrentDate((d) => addWeeks(d, 1))
    else if (view === "day") setCurrentDate((d) => addDays(d, 1))
  }
  const goToToday = () => setCurrentDate(new Date())

  const periodLabel = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy")
    if (view === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 })
      const we = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`
    }
    if (view === "day") return format(currentDate, "EEEE, MMMM d, yyyy")
    return "All Bookings"
  }

  // ---- BOOKING CARD (reused in multiple views) ----
  const BookingCard = ({ b, compact = false }: { b: Booking; compact?: boolean }) => (
    <div
      key={b.id}
      className={cn(
        "rounded-lg border p-2.5 space-y-1 transition-all hover:shadow-sm",
        b.status === "cancelled"
          ? "border-red-100 bg-red-50 opacity-70"
          : "border-[#c2d5f0] bg-[#e8f0fb]"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold" style={{ color: "#1e63ad" }}>
          {b.time_slot}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
            STATUS_COLORS[b.status]
          )}
        >
          {b.status}
        </span>
      </div>
      <p className="text-xs font-semibold text-foreground leading-tight">{b.student_name}</p>
      {!compact && (
        <>
          <p className="text-[10px] text-muted-foreground">{b.student_email}</p>
          <p className="text-[10px] text-muted-foreground italic truncate">{b.reason}</p>
          <p className="text-[10px]" style={{ color: "#5a7299" }}>{bookingDisplayId(b)}</p>
        </>
      )}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={() => handleEdit(b)}
          className="text-[10px] font-medium flex items-center gap-0.5 hover:underline"
          style={{ color: "#1e63ad" }}
        >
          <Pencil size={9} /> Edit
        </button>
        {b.status === "confirmed" && (
          <button
            onClick={() => handleCancelOverride(b)}
            className="text-[10px] font-medium text-orange-500 flex items-center gap-0.5 hover:underline"
          >
            <XCircle size={9} /> Cancel
          </button>
        )}
      </div>
    </div>
  )

  // ---- MONTH VIEW ----
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startPadding = getDay(monthStart)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: "#e8f0fb", background: "#f4f7fb" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "#5a7299" }}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="border-b border-r min-h-[80px]" style={{ borderColor: "#f0f4fb" }} />
            ))}
            {days.map((day, idx) => {
              const confirmed = bookingsForDate(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const todayDay = isToday(day)
              const isLastRow = Math.floor((startPadding + idx) / 7) === Math.floor((startPadding + days.length - 1) / 7)
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                  className={cn(
                    "min-h-[80px] p-1.5 border-b border-r cursor-pointer transition-colors relative",
                    isSelected ? "bg-[#e8f0fb]" : "hover:bg-[#f4f7fb]",
                    isLastRow && "border-b-0"
                  )}
                  style={{ borderColor: "#f0f4fb" }}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                      todayDay
                        ? "text-white"
                        : isSelected
                        ? "text-[#1e63ad] font-bold"
                        : "text-foreground"
                    )}
                    style={todayDay ? { background: "#1e63ad" } : {}}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {confirmed.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="truncate text-[10px] rounded px-1 py-0.5 font-medium text-white"
                        style={{ background: "#1e63ad" }}
                      >
                        {b.time_slot} {b.student_name.split(" ")[0]}
                      </div>
                    ))}
                    {confirmed.length > 2 && (
                      <div className="text-[10px] font-semibold" style={{ color: "#fbb315" }}>
                        +{confirmed.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Side panel */}
        <SidePanel />
      </div>
    )
  }

  // ---- WEEK VIEW (Outlook-style) ----
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b" style={{ borderColor: "#e8f0fb", background: "#f4f7fb" }}>
          <div className="py-2 border-r text-xs font-semibold text-center" style={{ borderColor: "#e8f0fb", color: "#5a7299" }}>
            Time
          </div>
          {weekDays.map((day) => {
            const todayDay = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className="py-2 text-center cursor-pointer hover:bg-[#e8f0fb] transition-colors"
                onClick={() => { setSelectedDay(day); setView("day") }}
              >
                <p className="text-[10px] font-semibold uppercase" style={{ color: "#5a7299" }}>
                  {format(day, "EEE")}
                </p>
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mt-0.5",
                    todayDay ? "text-white" : "text-foreground"
                  )}
                  style={todayDay ? { background: "#1e63ad" } : {}}
                >
                  {format(day, "d")}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time slots grid */}
        <div className="overflow-y-auto max-h-[560px]">
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot}
              className="grid grid-cols-8 border-b"
              style={{ borderColor: "#f0f4fb", minHeight: "72px" }}
            >
              <div
                className="px-2 py-2 text-[10px] font-semibold border-r flex items-center justify-center"
                style={{ borderColor: "#e8f0fb", color: "#5a7299", background: "#fafbfd" }}
              >
                {slot}
              </div>
              {weekDays.map((day) => {
                const dayBookings = allBookingsForDate(day).filter((b) => b.time_slot === slot)
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-1 border-r transition-colors",
                      isToday(day) && "bg-[#f0f5ff]"
                    )}
                    style={{ borderColor: "#f0f4fb" }}
                  >
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className={cn(
                          "rounded-lg p-1.5 text-[10px] cursor-pointer mb-0.5",
                          b.status === "cancelled"
                            ? "bg-red-100 border border-red-200 opacity-70"
                            : "text-white"
                        )}
                        style={b.status === "confirmed" ? { background: "#1e63ad" } : {}}
                        onClick={() => handleEdit(b)}
                        title={`${b.student_name} — ${b.reason}`}
                      >
                        <p className={cn("font-semibold leading-tight truncate", b.status === "cancelled" ? "text-red-700" : "text-white")}>
                          {b.student_name.split(" ")[0]}
                        </p>
                        <p className={cn("truncate leading-tight", b.status === "cancelled" ? "text-red-500" : "text-blue-100")}>
                          {bookingDisplayId(b)}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---- DAY VIEW ----
  const DayView = () => {
    const dayBookings = allBookingsForDate(currentDate)
    return (
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e8f0fb", background: "#f4f7fb" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5a7299" }}>
              {format(currentDate, "EEEE")}
            </p>
            <p className="text-base font-bold" style={{ color: "#0f1f3d" }}>
              {format(currentDate, "MMMM d, yyyy")}
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#e8f0fb", color: "#1e63ad" }}
          >
            {dayBookings.filter(b => b.status === "confirmed").length} booking{dayBookings.filter(b => b.status === "confirmed").length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="overflow-y-auto max-h-[560px]">
          {TIME_SLOTS.map((slot) => {
            const slotBookings = dayBookings.filter((b) => b.time_slot === slot)
            return (
              <div
                key={slot}
                className="flex gap-0 border-b"
                style={{ borderColor: "#f0f4fb", minHeight: "72px" }}
              >
                <div
                  className="w-24 shrink-0 px-3 py-3 text-xs font-semibold border-r flex items-center"
                  style={{ borderColor: "#e8f0fb", color: "#5a7299", background: "#fafbfd" }}
                >
                  {slot}
                </div>
                <div className="flex-1 p-2">
                  {slotBookings.length === 0 ? (
                    <div className="h-full flex items-center">
                      <p className="text-[11px]" style={{ color: "#c2d5f0" }}>Available</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {slotBookings.map((b) => (
                        <div
                          key={b.id}
                          className={cn(
                            "rounded-xl p-3 border",
                            b.status === "cancelled"
                              ? "bg-red-50 border-red-200 opacity-70"
                              : "border-[#c2d5f0]"
                          )}
                          style={b.status === "confirmed" ? { background: "#e8f0fb" } : {}}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold" style={{ color: "#0f1f3d" }}>{b.student_name}</p>
                              <p className="text-xs" style={{ color: "#5a7299" }}>{b.student_email}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 italic">{b.reason}</p>
                              <p className="text-[10px] mt-1 font-semibold" style={{ color: "#1e63ad" }}>
                                {bookingDisplayId(b)} &bull; {b.student_number}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                                STATUS_COLORS[b.status]
                              )}
                            >
                              {b.status}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => handleEdit(b)} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "#1e63ad" }}>
                              <Pencil size={11} /> Edit
                            </button>
                            {b.status === "confirmed" && (
                              <button onClick={() => handleCancelOverride(b)} className="text-xs font-medium text-orange-500 flex items-center gap-1 hover:underline">
                                <XCircle size={11} /> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---- SIDE PANEL (for month view) ----
  const SidePanel = () => {
    const panelBookings = selectedDay ? allBookingsForDate(selectedDay) : []
    return (
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
        {selectedDay ? (
          <>
            <div className="px-4 py-3 border-b" style={{ background: "#1e63ad", borderColor: "#1755a0" }}>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">{format(selectedDay, "EEEE")}</p>
              <p className="text-sm font-bold text-white">{format(selectedDay, "MMMM d, yyyy")}</p>
            </div>
            {panelBookings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CalendarDays size={28} className="mx-auto mb-2" style={{ color: "#c2d5f0" }} />
                <p className="text-sm text-muted-foreground">No bookings this day.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f4fb] max-h-[420px] overflow-y-auto p-3 space-y-2">
                {panelBookings.map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-8 text-center">
            <Calendar size={28} className="mx-auto mb-2" style={{ color: "#c2d5f0" }} />
            <p className="text-sm text-muted-foreground">Click a day to view bookings.</p>
          </div>
        )}
      </div>
    )
  }

  const views: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "month", label: "Month", icon: <Calendar size={13} /> },
    { key: "week", label: "Week", icon: <CalendarDays size={13} /> },
    { key: "day", label: "Day", icon: <LayoutList size={13} /> },
    { key: "list", label: "List", icon: <List size={13} /> },
    { key: "blocked", label: "Blocked", icon: <Ban size={13} /> },
  ]

  return (
    <div className="min-h-screen" style={{ background: "#f4f7fb" }}>
      {/* Top nav */}
      <header className="text-white sticky top-0 z-10 shadow-lg" style={{ background: "#1e63ad" }}>
        {/* Gold accent top */}
        <div style={{ background: "#fbb315", height: "4px" }} />
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0">
              <Image src="/images/ssa-logo.png" alt="SSA" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider leading-none">SSA</p>
              <h1 className="text-sm font-bold text-white">Staff Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              {views.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
                    view === key
                      ? "bg-white text-[#1e63ad]"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Navigation bar (for calendar views) */}
        {view !== "list" && view !== "blocked" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={prevPeriod}
                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white transition-colors"
                style={{ borderColor: "#d0ddf0", color: "#1e63ad", background: "#fff" }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextPeriod}
                className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white transition-colors"
                style={{ borderColor: "#d0ddf0", color: "#1e63ad", background: "#fff" }}
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-sm font-bold" style={{ color: "#0f1f3d" }}>{periodLabel()}</span>
            </div>
            <button
              onClick={goToToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-[#1e63ad] hover:text-white transition-colors"
              style={{ borderColor: "#1e63ad", color: "#1e63ad", background: "#fff" }}
            >
              Today
            </button>
          </div>
        )}

        {/* Views */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse" />)}
          </div>
        ) : (
          <>
            {view === "month" && <MonthView />}
            {view === "week" && <WeekView />}
            {view === "day" && <DayView />}

            {/* BLOCKED DATES VIEW */}
            {view === "blocked" && (
              <div className="space-y-4">
                {/* Add block form */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
                  <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: "#fff8e1", borderColor: "#fbb315" }}>
                    <Ban size={15} style={{ color: "#d9970c" }} />
                    <h2 className="text-sm font-bold" style={{ color: "#7a5000" }}>Block a Date</h2>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Block an entire day or a specific time slot. Existing bookings are not affected — only new ones are prevented.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Date to Block</Label>
                        <Input
                          type="date"
                          value={blockForm.date}
                          onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>
                          Time Slot
                          <span className="ml-1 font-normal text-muted-foreground">(optional — leave blank for whole day)</span>
                        </Label>
                        <select
                          value={blockForm.time_slot}
                          onChange={(e) => setBlockForm({ ...blockForm, time_slot: e.target.value })}
                          className="w-full h-9 rounded-md border px-3 text-sm bg-background"
                          style={{ borderColor: "#d0ddf0" }}
                        >
                          <option value="">— Entire Day —</option>
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Reason (shown to students)</Label>
                        <Input
                          placeholder="e.g. Holiday, Office closed..."
                          value={blockForm.reason}
                          onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    {blockError && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                        <AlertTriangle size={13} className="text-red-500 shrink-0" />
                        <p className="text-xs text-red-600">{blockError}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleBlockDate}
                      disabled={blockSaving}
                      size="sm"
                      className="gap-1.5 text-white"
                      style={{ background: "#d9970c" }}
                    >
                      {blockSaving
                        ? <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        : <Plus size={13} />}
                      Block Date
                    </Button>
                  </div>
                </div>

                {/* Blocked dates list */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
                  <div className="px-5 py-3 border-b" style={{ background: "#f4f7fb", borderColor: "#e8f0fb" }}>
                    <h2 className="text-sm font-bold" style={{ color: "#0f1f3d" }}>
                      Blocked Dates
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({blockedDates.length})</span>
                    </h2>
                  </div>
                  {loadingBlocked ? (
                    <div className="space-y-2 p-4">
                      {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                  ) : blockedDates.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle2 size={28} className="mx-auto mb-2 text-green-400" />
                      <p className="text-sm text-muted-foreground">No dates are currently blocked.</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "#f0f4fb" }}>
                      {blockedDates.map((bd) => (
                        <div key={bd.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#f4f7fb] transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: "#fff8e1" }}
                            >
                              <Ban size={14} style={{ color: "#d9970c" }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "#0f1f3d" }}>
                                {format(new Date(bd.date + "T12:00:00"), "EEEE, MMMM d, yyyy")}
                                {bd.time_slot && (
                                  <span
                                    className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                                    style={{ background: "#fff8e1", color: "#7a5000" }}
                                  >
                                    {bd.time_slot}
                                  </span>
                                )}
                                {!bd.time_slot && (
                                  <span
                                    className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded"
                                    style={{ background: "#fde8e8", color: "#b91c1c" }}
                                  >
                                    Full Day
                                  </span>
                                )}
                              </p>
                              {bd.reason && (
                                <p className="text-xs" style={{ color: "#5a7299" }}>{bd.reason}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockDate(bd.id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                            style={{ borderColor: "#d0ddf0", color: "#5a7299" }}
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LIST VIEW */}
            {view === "list" && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#d0ddf0" }}>
                {/* Date navigator */}
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#e8f0fb", background: "#fff" }}>
                  <button
                    onClick={() => setListDate((d) => subDays(d, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#1e63ad", color: "#fff" }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setListDate((d) => addDays(d, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#1e63ad", color: "#fff" }}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <span
                    className="px-4 py-1.5 rounded-lg border text-sm font-semibold"
                    style={{ borderColor: "#d0ddf0", color: "#0f1f3d", background: "#f4f7fb" }}
                  >
                    {format(listDate, "EEEE, MMM d")}
                  </span>
                  {listDateStr !== format(new Date(), "yyyy-MM-dd") && (
                    <button
                      onClick={() => setListDate(new Date())}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#1e63ad] hover:text-white"
                      style={{ borderColor: "#1e63ad", color: "#1e63ad", background: "#fff" }}
                    >
                      Today
                    </button>
                  )}
                </div>
                {/* Search + filter */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#e8f0fb", background: "#f4f7fb" }}>
                  <div className="relative flex-1 min-w-40">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#5a7299" }} />
                    <Input
                      placeholder="Search name, number, email, date..."
                      className="pl-8 h-8 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#d0ddf0" }}>
                    {(["all", "confirmed", "cancelled"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={cn("px-3 py-1.5 text-xs font-semibold capitalize transition-colors")}
                        style={
                          filterStatus === s
                            ? { background: "#1e63ad", color: "#fff" }
                            : { background: "#fff", color: "#5a7299" }
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No bookings found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "#e8f0fb", background: "#f4f7fb" }}>
                          {["Ref", "Date", "Time", "Student", "Student #", "Email", "Reason", "Status", "Actions"].map((h) => (
                            <th key={h} className="text-left text-xs font-semibold px-4 py-2.5 whitespace-nowrap" style={{ color: "#5a7299" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "#f0f4fb" }}>
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-[#f4f7fb] transition-colors">
                            <td className="px-4 py-2.5 font-mono text-xs font-bold" style={{ color: "#1e63ad" }}>
                              {bookingDisplayId(b)}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap font-medium" style={{ color: "#0f1f3d" }}>
                              {format(new Date(b.booking_date + "T12:00:00"), "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: "#0f1f3d" }}>{b.time_slot}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap font-medium" style={{ color: "#0f1f3d" }}>{b.student_name}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: "#5a7299" }}>{b.student_number}</td>
                            <td className="px-4 py-2.5 text-xs" style={{ color: "#5a7299" }}>{b.student_email}</td>
                            <td className="px-4 py-2.5 max-w-[180px] truncate text-xs" style={{ color: "#5a7299" }}>{b.reason}</td>
                            <td className="px-4 py-2.5">
                              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[b.status])}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleEdit(b)} style={{ color: "#1e63ad" }} title="Edit">
                                  <Pencil size={14} />
                                </button>
                                {b.status === "confirmed" && (
                                  <button onClick={() => handleCancelOverride(b)} className="text-orange-500" title="Cancel">
                                    <XCircle size={14} />
                                  </button>
                                )}
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
          </>
        )}
      </div>

      {/* Edit modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md" style={{ borderColor: "#d0ddf0" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#e8f0fb", background: "#1e63ad", borderRadius: "1rem 1rem 0 0" }}>
              <div className="flex items-center gap-2">
                <Pencil size={15} className="text-white" />
                <h3 className="font-bold text-white">Edit Booking {bookingDisplayId(editingBooking)}</h3>
              </div>
              <button onClick={() => setEditingBooking(null)} className="text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Full Name</Label>
                  <Input value={editForm.student_name || ""} onChange={(e) => setEditForm({ ...editForm, student_name: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Student Number</Label>
                  <Input value={editForm.student_number || ""} onChange={(e) => setEditForm({ ...editForm, student_number: e.target.value })} className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Email</Label>
                <Input value={editForm.student_email || ""} onChange={(e) => setEditForm({ ...editForm, student_email: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Date</Label>
                  <Input type="date" value={editForm.booking_date || ""} onChange={(e) => setEditForm({ ...editForm, booking_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Status</Label>
                  <select
                    value={editForm.status || "confirmed"}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "confirmed" | "cancelled" })}
                    className="w-full h-8 text-sm rounded-md border px-2"
                    style={{ borderColor: "#d0ddf0", background: "#fff" }}
                  >
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block" style={{ color: "#5a7299" }}>Reason</Label>
                <Input value={editForm.reason || ""} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "#e8f0fb" }}>
              <Button variant="outline" size="sm" onClick={() => setEditingBooking(null)} className="gap-1.5">
                <X size={13} /> Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5 text-white"
                style={{ background: "#1e63ad" }}
              >
                {saving ? <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Check size={13} />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
