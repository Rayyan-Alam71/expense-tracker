"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSignedMoney } from "@/lib/format";
import { typeTheme, type TransactionType } from "@/lib/theme";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { useToast } from "./ui/Toast";
import { TransactionForm, type TransactionItem } from "./TransactionForm";

type Category = { id: number; name: string; type: TransactionType };
const houseLabels = { RAYYAN: "Rayyan", HAMID: "Hamid", SHARED: "Shared" } as const;

export function DayTransactionList({ title, type, initial, categories }: { title: string; type: TransactionType; initial: TransactionItem[]; categories: Category[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<TransactionItem>();
  const [deleting, setDeleting] = useState<TransactionItem>();
  const [deletingLoading, setDeletingLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const remove = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    const response = await fetch(`/api/transactions/${deleting.id}`, { method: "DELETE" });
    const data = await response.json();
    setDeletingLoading(false);
    if (!response.ok) { toast(data.error ?? "Could not delete entry", true); return; }
    setItems((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(undefined); toast("Entry deleted"); router.refresh();
  };
  const transactionUpdated = (updated?: TransactionItem) => {
    if (updated) setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    setEditing(undefined);
  };
  return <section>
    <h2 className="mb-3 text-base font-semibold">{title}</h2>
    {items.length === 0 ? <EmptyState message={`No ${type.toLowerCase()} entries for this day.`} /> : <div className="space-y-2">
      {items.map((item) => <article key={item.id} className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${typeTheme[type].accent}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><Badge type={type}>{item.category.name}</Badge>{item.tenantName && <span className="text-xs text-slate-500">{item.tenantName}</span>}</div>
            <p className="mt-2 break-words text-sm text-slate-600">{item.description || "No description"}</p>
            {item.house && <p className="mt-1 text-xs font-medium text-indigo-600">{houseLabels[item.house]} house</p>}
          </div>
          <span className={`max-w-[42%] shrink-0 text-right text-sm font-semibold tabular-nums ${typeTheme[type].amount}`}>{formatSignedMoney(Number(item.amount), type)}</span>
        </div>
        <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
          <Button variant="icon" aria-label="Edit transaction" onClick={() => setEditing(item)}><Pencil size={17} /></Button>
          <Button variant="icon" aria-label="Delete transaction" onClick={() => setDeleting(item)}><Trash2 size={17} /></Button>
        </div>
      </article>)}
    </div>}
    {editing && <TransactionForm categories={categories} initial={editing} onSaved={transactionUpdated} />}
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(undefined)} onConfirm={remove} loading={deletingLoading} />
  </section>;
}
