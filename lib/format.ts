import { format, parseISO } from "date-fns";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number | string) {
  return `₹ ${moneyFormatter.format(Number(value))}`;
}

export function formatSignedMoney(value: number, type: "EXPENSE" | "INCOME") {
  return `${type === "EXPENSE" ? "−" : "+"} ${formatMoney(Math.abs(value))}`;
}

export function formatDate(date: string | Date) {
  return format(typeof date === "string" ? parseISO(date) : date, "dd MMM yyyy");
}

export function formatMonth(month: string) {
  return format(parseISO(`${month}-01`), "MMMM yyyy");
}

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}
