"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { Card } from "./ui/Card";

type ReportRow = { month: string; categoryId: number; categoryName: string; total: number };

export function ReportsTable({ year, initial }: { year: string; initial: ReportRow[] }) {
  const [selected, setSelected] = useState("");
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [house, setHouse] = useState("");
  const changeYear = async (value: string) => {
    window.history.replaceState(null, "", `/reports?year=${value}`);
    setLoading(true);
    try { const response = await fetch(`/api/reports?year=${value}${house ? `&house=${house}` : ""}`); if (!response.ok) throw new Error("Could not load report"); setRows(await response.json()); } finally { setLoading(false); }
  };
  const changeHouse = async (value: string) => {
    setHouse(value);
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?year=${year}${value ? `&house=${value}` : ""}`);
      if (!response.ok) throw new Error("Could not load report");
      setRows(await response.json());
    } finally {
      setLoading(false);
    }
  };
  const categories = useMemo(() => [...new Map(rows.map((row) => [row.categoryId, row.categoryName])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [rows]);
  const matrix = useMemo(() => categories.map(([categoryId, categoryName]) => {
    const values = Array.from({ length: 12 }, (_, index) => rows.filter((row) => row.categoryId === categoryId && Number(row.month.slice(5)) === index + 1).reduce((sum, row) => sum + row.total, 0));
    return { categoryId, categoryName, values, total: values.reduce((sum, value) => sum + value, 0) };
  }), [categories, rows]);
  const monthTotals = Array.from({ length: 12 }, (_, index) => matrix.reduce((sum, row) => sum + row.values[index], 0));
  const max = Math.max(...matrix.flatMap((row) => row.values), 0);
  const selectedRow = matrix.find((row) => String(row.categoryId) === selected);
  return <Card>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><div><h2 className="text-base font-semibold">Monthly spending report</h2><p className="text-sm text-slate-500">Expense totals by category and house</p></div><div className="grid grid-cols-1 gap-2 sm:flex"><input aria-label="Report year" type="number" min="1970" max="9999" defaultValue={year} onBlur={(event) => { if (/^\d{4}$/.test(event.target.value)) changeYear(event.target.value); }} className="min-h-11 w-full rounded-xl border border-slate-200 px-3 sm:w-24" /><select aria-label="Filter by house" value={house} onChange={(event) => changeHouse(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-auto"><option value="">All houses</option><option value="RAYYAN">Rayyan house</option><option value="HAMID">Hamid house</option><option value="SHARED">Shared / both houses</option></select><select aria-label="Highlight category" value={selected} onChange={(event) => setSelected(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-auto"><option value="">All categories</option>{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div></div>
    {loading && <div className="mb-3 h-2 animate-pulse rounded bg-slate-100" />}
    {matrix.length === 0 ? <p className="py-10 text-center text-slate-500">No expenses recorded for {year}.</p> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><th className="px-2 py-3">Category</th>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => <th key={month} className="px-2 py-3 text-right">{month}</th>)}<th className="px-2 py-3 text-right">Year total</th></tr></thead><tbody>{matrix.map((row) => { const rowMax = Math.max(...row.values); return <tr key={row.categoryId} className={`border-b border-slate-100 ${selected === String(row.categoryId) ? "bg-indigo-50" : ""}`}><th className="px-2 py-3 text-left font-medium">{row.categoryName}</th>{row.values.map((value, index) => <td key={index} className={`px-2 py-3 text-right tabular-nums ${value === rowMax && value > 0 ? "font-bold" : ""}`} style={{ backgroundColor: value ? `rgba(254, 226, 226, ${0.35 + (value / max) * 0.65})` : undefined }}>{value ? formatMoney(value) : <span className="text-slate-300">—</span>}</td>)}<td className="px-2 py-3 text-right font-semibold tabular-nums">{formatMoney(row.total)}</td></tr>; })}</tbody><tfoot><tr className="font-semibold"><th className="px-2 py-3 text-left">Monthly total</th>{monthTotals.map((total, index) => <td key={index} className="px-2 py-3 text-right tabular-nums">{total ? formatMoney(total) : "—"}</td>)}<td className="px-2 py-3 text-right tabular-nums">{formatMoney(monthTotals.reduce((sum, value) => sum + value, 0))}</td></tr></tfoot></table></div>}
    {selectedRow && <div className="mt-5 rounded-xl bg-indigo-50 p-4"><h3 className="font-semibold">Top months for {selectedRow.categoryName}</h3><div className="mt-2 flex flex-wrap gap-2 text-sm">{selectedRow.values.map((value, index) => ({ value, month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index] })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value).map((item) => <span key={item.month} className="rounded-lg bg-white px-3 py-2">{item.month}: {formatMoney(item.value)}</span>)}</div></div>}
  </Card>;
}
