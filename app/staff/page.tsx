"use client"

import { useState } from "react"
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import StaffDashboard from "@/components/StaffDashboard"
import Image from "next/image"
import Link from "next/link"

export default function StaffPage() {
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/staff/bookings?password=${encodeURIComponent(password)}`)
    setLoading(false)
    if (res.ok) {
      setAuthed(true)
    } else {
      setError("Incorrect password. Please try again.")
    }
  }

  if (authed) {
    return (
      <StaffDashboard
        password={password}
        onLogout={() => {
          setAuthed(false)
          setPassword("")
        }}
      />
    )
  }

  return (
    <main className="min-h-screen flex flex-col font-sans" style={{ background: "linear-gradient(160deg, #e8f0fb 0%, #f4f7fb 60%, #fff9ed 100%)" }}>
      {/* Header */}
      <header className="text-white shadow-md" style={{ background: "#1e63ad" }}>
        <div style={{ background: "#fbb315", height: "4px" }} />
        <div className="max-w-md mx-auto flex items-center gap-3 px-5 py-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
            <Image src="/images/ssa-logo.png" alt="SSA Logo" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="text-[10px] text-white/60 uppercase tracking-[0.18em] font-semibold leading-none">
              Science Students&apos; Association
            </p>
            <h1 className="text-sm font-bold text-white leading-tight">Staff Portal</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo + title */}
          <div className="text-center mb-7">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #1e63ad 0%, #2d7dd2 100%)" }}
            >
              <Lock size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: "#0f1f3d" }}>Staff Login</h2>
            <p className="text-sm mt-1" style={{ color: "#5a7299" }}>
              Enter your staff password to access the dashboard.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border shadow-xl p-6 space-y-4" style={{ borderColor: "#d0ddf0" }}>
            {/* Gold top stripe */}
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "#e8f0fb" }}>
              <Image src="/images/ssa-logo.png" alt="SSA" width={20} height={20} className="opacity-60" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a7299" }}>
                SSA Booking System
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-semibold mb-1.5 block" style={{ color: "#0f1f3d" }}>
                  Staff Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 border-[#d0ddf0] focus:border-[#1e63ad]"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#5a7299" }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold h-11 text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ background: "#1e63ad" }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: "#5a7299" }}>
            Not staff?{" "}
            <Link href="/" className="font-semibold hover:underline" style={{ color: "#1e63ad" }}>
              Go to booking page
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
