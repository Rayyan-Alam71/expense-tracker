"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatSignedMoney } from "@/lib/format";
import { typeTheme, type TransactionType } from "@/lib/theme";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { useToast } from "./ui/Toast";
import { TransactionForm, type TransactionItem } from "./TransactionForm";

type Category = { id: number; name: string; type: TransactionType };
const houseLabels = { RAYYAN: "Rayyan", HAMID: "Hamid", SHARED: "Shared" } as const;

export function TransactionList({ month, initial, categories }: { month: string; initial: TransactionItem[]; categories: Category[] }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initial);
  const [sort, setSort] = useState("date_desc");
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [editing, setEditing] = useState<TransactionItem | undefined>();
  const [deleting, setDeleting] = useState<TransactionItem | undefined>();
  const [deletingLoading, setDeletingLoading] = useState(false);
  const toast = useToast();
  useEffect(() => {
    let active = true;
    fetch(`/api/transactions?month=${month}&sort=${sort}${type ? `&type=${type}` : ""}${categoryId ? `&categoryId=${categoryId}` : ""}`)
      .then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); return response.json(); })
      .then((data) => { if (active) setTransactions(data); })
      .catch((error: Error) => toast(error.message, true))
    return () => { active = false; };
  }, [month, sort, type, categoryId, toast]);
  const remove = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    const response = await fetch(`/api/transactions/${deleting.id}`, { method: "DELETE" });
    const data = await response.json();
    setDeletingLoading(false);
    if (!response.ok) { toast(data.error ?? "Could not delete entry", true); return; }
    setTransactions((items) => items.filter((item) => item.id !== deleting.id));
    setDeleting(undefined); toast("Entry deleted");
    router.refresh();
  };
  const transactionUpdated = (updated?: TransactionItem) => {
    if (updated) {
      setTransactions((items) => items.map((item) => item.id === updated.id ? updated : item));
    }
    setEditing(undefined);
  };
  return <Card>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-base font-semibold">Month transactions</h2>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <select aria-label="Sort transactions" value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-auto"><option value="date_desc">Newest first</option><option value="amount_desc">Highest first</option><option value="amount_asc">Lowest first</option></select>
        <select aria-label="Filter by type" value={type} onChange={(event) => { setType(event.target.value); setCategoryId(""); }} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-auto"><option value="">All types</option><option value="EXPENSE">Expenses</option><option value="INCOME">Income</option></select>
        <select aria-label="Filter by category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm sm:w-auto"><option value="">All categories</option>{categories.filter((category) => !type || category.type === type).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      </div>
    </div>
    {transactions.length === 0 ? <EmptyState message="No entries for this month." /> : <>
      <div className="space-y-3 sm:hidden">
        {transactions.map((transaction) => <article key={transaction.id} className={`rounded-xl border border-slate-200 bg-white p-3 ${typeTheme[transaction.type].accent}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge type={transaction.type}>{transaction.category.name}</Badge>
              <p className="mt-2 text-xs text-slate-500">{formatDate(transaction.date)}</p>
              {transaction.description && <p className="mt-1 break-words text-sm text-slate-700">{transaction.description}</p>}
              {transaction.tenantName && <p className="mt-1 text-xs text-slate-500">{transaction.tenantName}</p>}
              {transaction.house && <p className="mt-1 text-xs font-medium text-indigo-600">{houseLabels[transaction.house]} house</p>}
            </div>
            <p className={`shrink-0 text-right text-sm font-bold tabular-nums ${typeTheme[transaction.type].amount}`}>{formatSignedMoney(Number(transaction.amount), transaction.type)}</p>
          </div>
          <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
            <Button variant="icon" aria-label="Edit transaction" onClick={() => setEditing(transaction)}><Pencil size={17} /></Button>
            <Button variant="icon" aria-label="Delete transaction" onClick={() => setDeleting(transaction)}><Trash2 size={17} /></Button>
          </div>
        </article>)}
      </div>
      <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3" /></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} className={`border-b border-slate-100 ${typeTheme[transaction.type].accent}`}><td className="px-3 py-3 text-slate-600">{formatDate(transaction.date)}</td><td className="px-3 py-3"><Badge type={transaction.type}>{transaction.category.name}</Badge>{transaction.tenantName && <span className="ml-2 text-xs text-slate-500">{transaction.tenantName}</span>}</td><td className="max-w-xs truncate px-3 py-3 text-slate-600">{transaction.description || "—"}</td><td className={`px-3 py-3 text-right font-semibold tabular-nums ${typeTheme[transaction.type].amount}`}>{formatSignedMoney(Number(transaction.amount), transaction.type)}</td><td className="px-3 py-3"><div className="flex justify-end gap-1"><Button variant="icon" aria-label="Edit transaction" onClick={() => setEditing(transaction)}><Pencil size={17} /></Button><Button variant="icon" aria-label="Delete transaction" onClick={() => setDeleting(transaction)}><Trash2 size={17} /></Button></div></td></tr>)}</tbody></table></div>
    </>}
    {editing && <TransactionForm categories={categories} initial={editing} onSaved={transactionUpdated} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(undefined)} onConfirm={remove} loading={deletingLoading} />
  </Card>;
}
