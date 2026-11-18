"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const change = (value: string) => router.push(`/dashboard?month=${value}`);
  const date = parseISO(`${month}-01`);
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-auto">
      <Button variant="icon" aria-label="Previous month" onClick={() => change(format(addMonths(date, -1), "yyyy-MM"))}><ChevronLeft size={20} /></Button>
      <label className="min-w-0 flex-1 text-base font-semibold text-slate-900">
        <span className="sr-only">Selected month</span>
        <input type="month" value={month} onChange={(event) => change(event.target.value)} className="w-full min-w-0 rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:px-3 sm:text-base" />
      </label>
      <Button variant="icon" aria-label="Next month" onClick={() => change(format(addMonths(date, 1), "yyyy-MM"))}><ChevronRight size={20} /></Button>
    </div>
  );
}
