"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("paisa_auth");
      localStorage.removeItem("paisa_user");
      router.replace("/");
      router.refresh();
    }
  }
  return <button type="button" onClick={logout} disabled={loading} className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm text-slate-500 hover:bg-slate-100" aria-label="Sign out"><LogOut size={17} /><span className="hidden md:inline">{loading ? "Signing out..." : "Sign out"}</span></button>;
}
