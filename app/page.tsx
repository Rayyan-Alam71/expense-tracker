import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, WalletCards } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.35),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_32%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">₹</span>PaisaTrack</Link>
          <Link href="/login" className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium transition hover:bg-white/10">Sign in</Link>
        </header>
        <section className="flex flex-1 items-center py-12">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-2 text-sm text-indigo-100"><ShieldCheck size={16} /> Private personal expense tracking</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Know exactly where every rupee goes.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Track income and expenses for Rayyan and Hamid, compare categories, and keep a clear monthly and yearly picture.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 font-semibold shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400">Create account <ArrowRight size={18} /></Link>
              <Link href="/login" className="flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 font-semibold transition hover:bg-white/10">I already have an account</Link>
            </div>
          </div>
        </section>
        <section className="grid gap-3 pb-6 sm:grid-cols-3">
          {[{ icon: WalletCards, title: "Fast entries", text: "Add, edit and remove records quickly" }, { icon: BarChart3, title: "Clear reports", text: "Filter spending by house and category" }, { icon: ShieldCheck, title: "Account protected", text: "Secure sign-in for every session" }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><Icon className="text-indigo-300" size={20} /><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-400">{text}</p></div>)}
        </section>
      </div>
    </main>
  );
}
