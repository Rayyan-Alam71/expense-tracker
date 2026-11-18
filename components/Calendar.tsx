"use client";

import Link from "next/link";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { formatMoney } from "@/lib/format";

type DayTotal = { date: string; income: number; expense: number };

export function Calendar({ month, totals }: { month: string; totals: DayTotal[] }) {
  const selected = parseISO(`${month}-01`);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(selected)), end: endOfWeek(endOfMonth(selected)) });
  const byDate = new Map(totals.map((day) => [day.date, day]));
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const date = format(day, "yyyy-MM-dd");
          const total = byDate.get(date);
          return <Link key={date} href={`/day/${date}`} className={`min-h-14 min-w-0 rounded-lg border p-1 text-left transition-colors hover:bg-slate-50 sm:min-h-20 sm:rounded-xl sm:p-1.5 ${isSameMonth(day, selected) ? "border-slate-200" : "border-transparent opacity-40"} ${date === today ? "ring-2 ring-indigo-500" : ""}`}>
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs sm:h-7 sm:w-7 sm:text-sm ${date === today ? "font-bold text-indigo-700" : ""}`}>{format(day, "d")}</span>
            {total?.expense ? <span className="block truncate text-[9px] font-semibold text-red-600 sm:text-[11px]" title={formatMoney(total.expense)}>−{formatMoney(total.expense).replace("₹ ", "")}</span> : null}
            {total?.income ? <span className="block truncate text-[9px] font-semibold text-emerald-600 sm:text-[11px]" title={formatMoney(total.income)}>+{formatMoney(total.income).replace("₹ ", "")}</span> : null}
          </Link>;
        })}
      </div>
    </div>
  );
}
