"use client"

import { useState } from "react"
import { FlaskConical, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import StaffDashboard from "@/components/StaffDashboard"

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
    const res = await fetch(
      `/api/staff/bookings?password=${encodeURIComponent(password)}`
    )
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
    <main className="min-h-screen bg-background flex flex-col">
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
              Staff Portal
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Lock size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Staff Login</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your staff password to access the booking dashboard.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4"
          >
            <div>
              <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">
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
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
                <AlertTriangle size={13} className="text-destructive shrink-0" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
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

          <p className="text-center text-xs text-muted-foreground mt-5">
            Not staff?{" "}
            <a href="/" className="text-accent hover:underline font-medium">
              Go to booking page
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
