"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, username, password, confirmPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create account");
      localStorage.setItem("paisa_auth", data.token);
      localStorage.setItem("paisa_user", JSON.stringify(data.user));
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8"><Link href="/" className="mb-6 flex items-center gap-2 font-bold text-slate-900"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">₹</span>PaisaTrack</Link><h1 className="text-2xl font-bold">Create your account</h1><p className="mb-6 mt-1 text-sm text-slate-500">Register to protect your personal records.</p><form onSubmit={submit} className="space-y-4">{[
    ["Name", name, setName, "text", "name"],
    ["Username", username, setUsername, "text", "username"],
    ["Password", password, setPassword, "password", "new-password"],
    ["Confirm password", confirmPassword, setConfirmPassword, "password", "new-password"],
  ].map(([label, value, setter, type, autoComplete]) => <label key={String(label)} className="block text-sm font-medium text-slate-700">{String(label)}<input required type={String(type)} value={String(value)} onChange={(event) => (setter as (value:string)=>void)(event.target.value)} autoComplete={String(autoComplete)} className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>)}{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={loading} className="min-h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white disabled:opacity-60">{loading ? "Creating account..." : "Create account"}</button></form><p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-indigo-600" href="/login">Sign in</Link></p></div></main>;
}
