import BookingForm from "@/components/BookingForm"
import { FlaskConical } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Top header bar */}
      <header className="bg-[var(--ssa-navy)] text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--ssa-blue)]">
            <FlaskConical size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest font-medium">
              Science Students Association
            </p>
            <h1 className="text-base font-bold text-white leading-tight">
              Study Room Booking
            </h1>
          </div>
        </div>
      </header>

      {/* Sub-header */}
      <div className="bg-[var(--ssa-blue)] text-white py-3 px-4">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-white/90 leading-relaxed">
            Reserve the SSA study room for up to <strong>1 hour per day</strong>. Weekdays only.
          </p>
        </div>
      </div>

      {/* Booking form */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <BookingForm />
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-5 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Science Students Association &bull; Questions? Contact the SSA office.
          </p>
        </div>
      </footer>
    </main>
  )
}
