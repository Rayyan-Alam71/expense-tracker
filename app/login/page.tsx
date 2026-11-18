"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in");
      localStorage.setItem("paisa_auth", data.token);
      localStorage.setItem("paisa_user", JSON.stringify(data.user));
      const next = new URL(window.location.href).searchParams.get("next");
      router.replace(next?.startsWith("/dashboard") || next?.startsWith("/day") || next?.startsWith("/reports") ? next : "/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8"><Link href="/" className="mb-6 flex items-center gap-2 font-bold text-slate-900"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">₹</span>PaisaTrack</Link><h1 className="text-2xl font-bold">Welcome back</h1><p className="mb-6 mt-1 text-sm text-slate-500">Sign in to your personal tracker.</p><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium text-slate-700">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label><label className="block text-sm font-medium text-slate-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={loading} className="min-h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button></form><p className="mt-5 text-center text-sm text-slate-500">New here? <Link className="font-semibold text-indigo-600" href="/register">Create an account</Link></p></div></main>;
}
