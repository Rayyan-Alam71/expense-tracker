export type TransactionType = "EXPENSE" | "INCOME";

export const typeTheme = {
  EXPENSE: {
    amount: "text-red-600",
    soft: "bg-red-50",
    border: "border-red-200",
    accent: "border-l-4 border-red-500",
    badge: "bg-red-100 text-red-700",
    button: "bg-red-600 hover:bg-red-700 text-white",
    focus: "focus:ring-red-500",
    sign: "−",
  },
  INCOME: {
    amount: "text-emerald-600",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
    accent: "border-l-4 border-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    focus: "focus:ring-emerald-500",
    sign: "+",
  },
} as const satisfies Record<TransactionType, Record<string, string>>;

export function getNetType(value: number): TransactionType {
  return value < 0 ? "EXPENSE" : "INCOME";
}
