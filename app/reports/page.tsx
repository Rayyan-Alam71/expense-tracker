import { connection } from "next/server";
import { ReportsTable } from "@/components/ReportsTable";
import { todayString } from "@/lib/format";
import { getReport } from "@/lib/queries";
import { isValidYear } from "@/lib/validators";
import { getServerSession } from "@/lib/session";
import { Header } from "@/components/Header";
import { AuthGate } from "@/components/AuthGate";

export const instant = false;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string | string[] }> }) {
  await connection();
  const session = await getServerSession();
  if (!session) return null;
  const params = await searchParams;
  const requested = Array.isArray(params.year) ? params.year[0] : params.year;
  const currentYear = todayString().slice(0, 4);
  const year = requested && isValidYear(requested) ? requested : currentYear;
  const report = await getReport(year, session.id);
  return <AuthGate><Header /><div className="mobile-safe-bottom mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6"><div><p className="text-sm font-medium text-indigo-600">Reports</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Spending by category</h1></div><ReportsTable year={year} initial={report} /></div></AuthGate>;
}
