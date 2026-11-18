import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`vibrant-card rounded-2xl border border-slate-200/80 bg-white/95 p-4 sm:p-6 ${className}`} {...props} />;
}
