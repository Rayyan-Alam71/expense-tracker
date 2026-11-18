"use client";

import type { ButtonHTMLAttributes } from "react";
import { typeTheme, type TransactionType } from "@/lib/theme";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "type" | "ghost" | "icon";
  tone?: TransactionType;
  loading?: boolean;
};

export function Button({ variant = "primary", tone = "EXPENSE", loading, children, className = "", disabled, ...props }: Props) {
  const styles = variant === "type"
    ? typeTheme[tone].button
    : variant === "ghost"
      ? "bg-transparent text-slate-600 hover:bg-slate-100"
      : variant === "icon"
        ? "bg-transparent text-slate-500 hover:bg-slate-100"
        : "bg-indigo-600 text-white hover:bg-indigo-700";
  return (
    <button className={`min-h-11 rounded-xl px-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant === "icon" ? "px-3" : ""} ${styles} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? "Saving..." : children}
    </button>
  );
}
