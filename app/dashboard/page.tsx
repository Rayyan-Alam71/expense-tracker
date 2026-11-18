import { format, parseISO } from "date-fns";
import { connection } from "next/server";
import { Calendar } from "@/components/Calendar";
import { MonthPicker } from "@/components/MonthPicker";
import { TransactionList } from "@/components/TransactionList";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney, formatMonth, formatSignedMoney, todayString } from "@/lib/format";
import { getCategories, getCategoryBreakdown, getDailyTotals, getMonthSummary, getTransactions } from "@/lib/queries";
import { typeTheme, getNetType } from "@/lib/theme";
import { serializeTransaction } from "@/lib/api";
import { isValidMonth } from "@/lib/validators";
import { AuthGate } from "@/components/AuthGate";
import { Header } from "@/components/Header";
import { getServerSession } from "@/lib/session";

type Props = { searchParams: Promise<{ month?: string | string[] }> };

export const instant = false;

export default async function Dashboard({ searchParams }: Props) {
  await connection();
  const session = await getServerSession();
  if (!session) return null;
  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const currentMonth = todayString().slice(0, 7);
  const month = requested && isValidMonth(requested) ? requested : currentMonth;
  const [summary, dailyTotals, breakdown, rawTransactions, categories] = await Promise.all([
    getMonthSummary(month, session.id),
    getDailyTotals(month, session.id),
    getCategoryBreakdown(month, session.id),
    getTransactions({ userId: session.id, month, sort: "date_desc" }),
    getCategories(),
  ]);
  const transactions = rawTransactions.map(serializeTransaction);
  const maxBreakdown = breakdown[0]?.total ?? 1;
  return <AuthGate><Header /><div className="mobile-safe-bottom mx-auto max-w-6xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-indigo-600">Monthly overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{formatMonth(month)}</h1></div><div className="w-full sm:w-auto"><MonthPicker month={month} /></div></section>
    <section className="grid gap-4 sm:grid-cols-3">
      {([["Total Income", summary.totalIncome, "INCOME"], ["Total Expense", summary.totalExpense, "EXPENSE"], ["Net", summary.net, getNetType(summary.net)]] as const).map(([label, value, type]) => <Card key={label} className={`relative min-w-0 overflow-hidden ${typeTheme[type].soft} ${typeTheme[type].border}`}><span className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${type === "INCOME" ? "bg-emerald-400" : "bg-red-400"}`} /><p className="text-sm font-medium text-slate-600">{label}</p><p className={`mt-2 break-words text-xl font-bold tabular-nums sm:text-2xl ${typeTheme[type].amount}`}>{label === "Net" ? formatSignedMoney(value, type) : `${type === "INCOME" ? "+" : "−"} ${formatMoney(value)}`}</p></Card>)}
    </section>
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <Card><h2 className="mb-4 text-base font-semibold">Calendar</h2><Calendar month={month} totals={dailyTotals} /></Card>
      <Card><h2 className="mb-4 text-base font-semibold">Day-wise totals</h2>{dailyTotals.length === 0 ? <EmptyState message="No entries for this month." /> : <div className="space-y-2">{dailyTotals.map((day) => <a key={day.date} href={`/day/${day.date}`} className="block rounded-xl border-l-4 border-slate-300 px-3 py-2 hover:bg-slate-50"><div className="flex justify-between text-sm font-medium"><span>{format(parseISO(day.date), "dd MMM")}</span><span className="text-slate-500">{formatSignedMoney(day.income - day.expense, getNetType(day.income - day.expense))}</span></div><div className="mt-1 flex gap-3 text-xs"><span className="text-red-600">− {formatMoney(day.expense)}</span><span className="text-emerald-600">+ {formatMoney(day.income)}</span></div></a>)}</div>}</Card>
    </section>
    <TransactionList month={month} initial={transactions} categories={categories} />
    <Card><h2 className="mb-4 text-base font-semibold">Expense by category</h2>{breakdown.length === 0 ? <EmptyState message="No expense categories for this month." /> : <div className="space-y-4">{breakdown.map((item) => <div key={item.categoryId}><div className="mb-1 flex justify-between text-sm"><span>{item.categoryName}</span><span className="font-medium tabular-nums text-red-600">{formatMoney(item.total)}</span></div><div className="h-2 rounded-full bg-red-50"><div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.max(4, item.total / maxBreakdown * 100)}%` }} /></div></div>)}</div>}</Card>
  </div></AuthGate>;
}
