import Link from "next/link";
import { connection } from "next/server";
import { BarChart3, LayoutDashboard, Plus } from "lucide-react";
import { getCategories, getNetBalance } from "@/lib/queries";
import { todayString, formatMoney } from "@/lib/format";
import { getNetType, typeTheme } from "@/lib/theme";
import { TransactionForm } from "@/components/TransactionForm";
import { getServerSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

export async function Header() {
  await connection();
  const session = await getServerSession();
  if (!session) return null;
  const [balance, categories] = await Promise.all([getNetBalance(todayString(), session.id), getCategories()]);
  const type = getNetType(balance);
  return (
    <header className="glass-header sticky top-0 z-30 border-b border-slate-200/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">₹</span>
            <span>PaisaTrack</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Dashboard</Link>
            <Link href="/reports" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Reports</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded-lg border px-2 py-1.5 text-right text-[10px] sm:px-3 sm:py-2 sm:text-xs ${typeTheme[type].soft} ${typeTheme[type].border} ${typeTheme[type].amount}`}>
            <span className="block font-medium">{balance < 0 ? "Net Expense" : "Net Earning"}</span>
            <span className="tabular-nums text-sm font-bold">{formatMoney(Math.abs(balance))}</span>
          </div>
          <div className="hidden sm:block">
            <TransactionForm categories={categories} trigger={<span className="flex items-center gap-1"><Plus size={17} /> Add</span>} />
          </div>
          <LogoutButton />
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-4 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl sm:hidden" aria-label="Mobile navigation">
        <Link href="/dashboard" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-indigo-600"><LayoutDashboard size={20} />Dashboard</Link>
        <div className="-mt-7 flex justify-center">
          <TransactionForm categories={categories} buttonClassName="h-14 w-14 rounded-full p-0 shadow-lg shadow-indigo-300" trigger={<span className="flex h-14 w-14 items-center justify-center"><Plus size={26} /></span>} />
        </div>
        <Link href="/reports" className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-slate-500"><BarChart3 size={20} />Reports</Link>
      </nav>
    </header>
  );
}
