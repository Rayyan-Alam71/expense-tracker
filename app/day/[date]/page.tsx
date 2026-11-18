import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { connection } from "next/server";
import { DayTransactionList } from "@/components/DayTransactionList";
import { TransactionForm } from "@/components/TransactionForm";
import { Card } from "@/components/ui/Card";
import { formatDate, formatMoney, formatSignedMoney } from "@/lib/format";
import { getCategories, getNetBalance, getTransactions } from "@/lib/queries";
import { getNetType } from "@/lib/theme";
import { serializeTransaction } from "@/lib/api";
import { isValidDate } from "@/lib/validators";
import { getServerSession } from "@/lib/session";
import { Header } from "@/components/Header";
import { AuthGate } from "@/components/AuthGate";

export const instant = false;

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  await connection();
  const session = await getServerSession();
  if (!session) return null;
  const { date } = await params;
  if (!isValidDate(date)) return <div className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-2xl font-semibold">Invalid date</h1></div>;
  const [rawTransactions, balance, categories] = await Promise.all([getTransactions({ userId: session.id, date, sort: "date_desc" }), getNetBalance(date, session.id), getCategories()]);
  const transactions = rawTransactions.map(serializeTransaction);
  const expenses = transactions.filter((item) => item.type === "EXPENSE");
  const income = transactions.filter((item) => item.type === "INCOME");
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);
  const day = parseISO(date);
  const previous = format(addDays(day, -1), "yyyy-MM-dd");
  const next = format(addDays(day, 1), "yyyy-MM-dd");
  return <AuthGate><Header /><div className="mobile-safe-bottom mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-1 sm:grid-cols-[100px_1fr_100px] sm:gap-3"><Link href={`/day/${previous}`} aria-label="Previous day" className="flex h-11 items-center justify-center rounded-xl text-sm text-slate-600 hover:bg-slate-100 sm:justify-start sm:px-3"><ChevronLeft size={18} /><span className="hidden sm:inline">Previous</span></Link><div className="min-w-0 text-center"><p className="text-xs text-slate-500 sm:text-sm">Day detail</p><h1 className="truncate text-lg font-semibold sm:text-2xl">{formatDate(date)}</h1></div><Link href={`/day/${next}`} aria-label="Next day" className="flex h-11 items-center justify-center rounded-xl text-sm text-slate-600 hover:bg-slate-100 sm:justify-end sm:px-3"><span className="hidden sm:inline">Next</span><ChevronRight size={18} /></Link></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Card className="min-w-0 border-red-200 bg-red-50"><p className="text-sm text-slate-500">Expense</p><p className="mt-2 break-words text-xl font-bold tabular-nums text-red-600">− {formatMoney(totalExpense)}</p></Card><Card className="min-w-0 border-emerald-200 bg-emerald-50"><p className="text-sm text-slate-500">Income</p><p className="mt-2 break-words text-xl font-bold tabular-nums text-emerald-600">+ {formatMoney(totalIncome)}</p></Card><Card className="min-w-0"><p className="text-sm text-slate-500">Balance up to day</p><p className={`mt-2 break-words text-xl font-bold tabular-nums ${getNetType(balance) === "EXPENSE" ? "text-red-600" : "text-emerald-600"}`}>{formatSignedMoney(balance, getNetType(balance))}</p></Card></div>
    <div className="flex justify-end"><TransactionForm categories={categories} date={date} trigger="+ Add for this day" /></div>
    <DayTransactionList title="Expenses" type="EXPENSE" initial={expenses} categories={categories} />
    <DayTransactionList title="Income" type="INCOME" initial={income} categories={categories} />
  </div></AuthGate>;
}
