import type { TransactionType } from "@/lib/theme";
import { typeTheme } from "@/lib/theme";

export function Badge({ type, children }: { type: TransactionType; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${typeTheme[type].badge}`}>{children}</span>;
}
