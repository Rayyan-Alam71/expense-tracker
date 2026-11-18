"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { todayString } from "@/lib/format";
import { typeTheme, type TransactionType } from "@/lib/theme";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { useToast } from "./ui/Toast";

type Category = { id: number; name: string; type: TransactionType };
export type TransactionItem = { id: number; type: TransactionType; amount: string; date: string; categoryId: number; description: string | null; tenantName: string | null; house: "RAYYAN" | "HAMID" | "SHARED" | null; category: Category };

export function TransactionForm({ categories, trigger, initial, date, onSaved, buttonClassName }: { categories: Category[]; trigger?: React.ReactNode; initial?: TransactionItem; date?: string; onSaved?: (transaction?: TransactionItem) => void; buttonClassName?: string }) {
  const router = useRouter();
  const toast = useToast();
  const amountRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(Boolean(initial));
  const [type, setType] = useState<TransactionType>(initial?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [entryDate, setEntryDate] = useState(initial?.date ?? date ?? todayString());
  const [categoryId, setCategoryId] = useState(String(initial?.categoryId ?? ""));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tenantName, setTenantName] = useState(initial?.tenantName ?? "");
  const [house, setHouse] = useState<"RAYYAN" | "HAMID" | "SHARED" | "">(
    initial?.house ?? "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const available = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);
  const selectedCategory = available.find((category) => category.id === Number(categoryId));
  const isEditing = Boolean(initial);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => amountRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);
  const openForm = () => {
    if (!initial) {
      setType("EXPENSE"); setAmount(""); setEntryDate(date ?? todayString()); setCategoryId(""); setDescription(""); setTenantName(""); setHouse("");
    }
    setError(""); setOpen(true);
  };
  const addCategory = async () => {
    const name = window.prompt("New category name");
    if (!name?.trim()) return;
    const response = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Could not add category"); return; }
    setCategoryId(String(data.id)); router.refresh();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    const payload = { type, amount, date: entryDate, categoryId: Number(categoryId), description, tenantName, house: type === "EXPENSE" ? house || null : null };
    const response = await fetch(isEditing ? `/api/transactions/${initial?.id}` : "/api/transactions", { method: isEditing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) { setError(data.error ?? "Could not save entry"); toast(data.error ?? "Could not save entry", true); return; }
    toast(isEditing ? "Entry updated" : `${type === "EXPENSE" ? "Expense" : "Income"} added`);
    router.refresh(); onSaved?.(data);
    if (isEditing) setOpen(false);
    else { setAmount(""); setDescription(""); setTenantName(""); setTimeout(() => amountRef.current?.focus(), 0); }
  };
  return <>
    {trigger ? <Button variant="primary" className={buttonClassName} onClick={openForm}>{trigger}</Button> : <Button variant="primary" className={buttonClassName} onClick={openForm}>+ Add</Button>}
    <Modal open={open} onClose={() => setOpen(false)} title={isEditing ? "Edit transaction" : "Add transaction"}>
      <form onSubmit={submit} className={`space-y-4 border-t-4 p-4 pb-20 text-base sm:p-5 sm:pb-5 ${typeTheme[type].border.replace("border-", "border-t-")}`}>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {(["EXPENSE", "INCOME"] as const).map((value) => <button key={value} type="button" onClick={() => { setType(value); setCategoryId(""); }} className={`min-h-11 rounded-lg text-sm font-medium ${type === value ? `${typeTheme[value].soft} ${typeTheme[value].amount}` : "text-slate-500"}`}>{value === "EXPENSE" ? "Expense" : "Income"}</button>)}
        </div>
        <label className="block text-sm font-medium text-slate-700">Amount<input ref={amountRef} required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 tabular-nums focus:outline-none focus:ring-2 ${typeTheme[type].focus}`} placeholder="0.00" /></label>
        <label className="block text-sm font-medium text-slate-700">Date<input required type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
        <label className="block text-sm font-medium text-slate-700">Category<select required value={categoryId} onChange={(event) => event.target.value === "__new__" ? addCategory() : setCategoryId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Choose a category</option>{available.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}<option value="__new__">+ Add new category</option></select></label>
        {type === "EXPENSE" && <label className="block text-sm font-medium text-slate-700">House <span className="font-normal text-slate-400">(optional)</span><select value={house} onChange={(event) => setHouse(event.target.value as "RAYYAN" | "HAMID" | "SHARED" | "")} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">General / not assigned</option><option value="RAYYAN">Rayyan house</option><option value="HAMID">Hamid house</option><option value="SHARED">Shared / both houses</option></select></label>}
        {selectedCategory?.name === "Rent" && <label className="block text-sm font-medium text-slate-700">Tenant name<input required value={tenantName} onChange={(event) => setTenantName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>}
        <label className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Done</Button><Button type="submit" variant="type" tone={type} loading={saving}>{isEditing ? "Save changes" : "Save"}</Button></div>
      </form>
    </Modal>
  </>;
}
