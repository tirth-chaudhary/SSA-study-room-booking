import BookingForm from "@/components/BookingForm"
import { LogIn, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg, #e8f0fb 0%, #f5f7fb 60%)" }}>
      {/* Top header bar */}
      <header style={{ background: "#1e63ad" }} className="text-white shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md shrink-0">
              <Image
                src="/ssa-logo.png"
                alt="SSA Logo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-xs text-white/70 uppercase tracking-widest font-semibold leading-none">
                Science Students&apos; Association
              </p>
              <h1 className="text-lg font-bold text-white leading-tight">
                Study Room Booking
              </h1>
              <p className="text-xs text-white/60 leading-none">University of Manitoba</p>
            </div>
          </div>
          <Link
            href="/staff"
            className="flex items-center gap-2 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow"
            style={{ background: "#fbb315", color: "#0f1c2e" }}
          >
            <LogIn size={15} />
            <span className="hidden sm:inline">Staff Login</span>
          </Link>
        </div>
      </header>

      {/* Hero banner */}
      <div style={{ background: "#0f1c2e" }} className="px-4 py-5">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-white font-semibold text-base leading-snug">
              Reserve the SSA Study Room
            </p>
            <p className="text-white/60 text-sm mt-0.5">
              Weekdays &bull; 8:30 AM – 4:30 PM &bull; 1 hour per student per day &bull; Up to 1 week ahead
            </p>
          </div>
          <div
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ background: "#fbb315", color: "#0f1c2e" }}
          >
            Free to Book
          </div>
        </div>
      </div>

      {/* Key reminder */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ background: "#fffbeb", borderColor: "#fbb315" }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "#b45309" }} />
          <p className="text-sm leading-relaxed" style={{ color: "#92400e" }}>
            <strong>Reminder:</strong> Please do not leave a key inside the office &mdash; you may get locked out.
          </p>
        </div>
      </div>

      {/* Booking form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BookingForm />
      </div>

      {/* Footer */}
      <footer className="border-t mt-8 py-6 px-4" style={{ borderColor: "#d1dce8" }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image src="/ssa-logo.png" alt="SSA" width={24} height={24} className="opacity-50" />
            <p className="text-xs" style={{ color: "#5a718a" }}>
              &copy; {new Date().getFullYear()} Science Students&apos; Association &bull; University of Manitoba
            </p>
          </div>
          <p className="text-xs" style={{ color: "#5a718a" }}>Questions? Contact the SSA office.</p>
        </div>
      </footer>
    </main>
  )
}
