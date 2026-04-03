import BookingForm from "@/components/BookingForm"
import { LogIn } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen font-sans" style={{ background: "linear-gradient(160deg, #e8f0fb 0%, #f4f7fb 60%, #fff9ed 100%)" }}>
      {/* Top header bar */}
      <header style={{ background: "#1e63ad" }} className="text-white shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {/* SSA Logo */}
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <Image
                src="/images/ssa-logo.png"
                alt="SSA Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
                loading="eager"
              />
            </div>
            <div>
              <p className="text-[10px] text-white/70 uppercase tracking-[0.18em] font-semibold leading-none">
                Science Students&apos; Association
              </p>
              <h1 className="text-[15px] font-bold text-white leading-tight tracking-tight">
                Study Room Booking
              </h1>
            </div>
          </div>
          <Link
            href="/staff"
            className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/30 hover:bg-white/15 transition-all"
          >
            <LogIn size={14} />
            <span>Staff Login</span>
          </Link>
        </div>

        {/* Gold accent bar */}
        <div style={{ background: "#fbb315", height: "4px" }} />
      </header>

      {/* Hero section */}
      <div style={{ background: "#1e63ad" }} className="pb-10 pt-5 px-4">
        <div className="max-w-lg mx-auto text-center space-y-2">
          <h2 className="text-2xl font-bold text-white text-balance">
            Reserve Your Study Space
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Book the SSA study room — weekdays only, 8:30 AM to 4:30 PM.<br className="hidden sm:block" />
            Up to <strong className="text-white">1 hour per person per day</strong>, up to 1 week ahead.
          </p>
        </div>
      </div>

      {/* Card lifts up over hero */}
      <div className="max-w-lg mx-auto px-4 -mt-5 pb-10">
        <div className="bg-white rounded-2xl shadow-xl border border-white/80 overflow-hidden">
          {/* Gold top stripe */}
          <div style={{ background: "#fbb315", height: "5px" }} />
          <div className="p-6">
            <BookingForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#d0ddf0] py-5 px-4 bg-white/60">
        <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image
              src="/images/ssa-logo.png"
              alt="SSA"
              width={22}
              height={22}
              className="opacity-40"
            />
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Science Students&apos; Association &bull; University of Manitoba
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Questions? Contact the SSA office.</p>
        </div>
      </footer>
    </main>
  )
}
