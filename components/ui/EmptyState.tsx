import { Inbox } from "lucide-react";

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-slate-500"><Inbox size={24} /><p>{message}</p>{action}</div>;
}
