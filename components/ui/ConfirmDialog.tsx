"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({ open, onClose, onConfirm, loading = false }: { open: boolean; onClose: () => void; onConfirm: () => void; loading?: boolean }) {
  return <Modal open={open} onClose={onClose} title="Delete this entry?"><div className="space-y-5 p-5"><p className="text-sm text-slate-600">This action cannot be undone.</p><div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button className="bg-slate-900 text-white hover:bg-slate-800" loading={loading} onClick={onConfirm}>Delete</Button></div></div></Modal>;
}
