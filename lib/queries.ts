import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";

function utcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function monthRange(month: string) {
  const start = utcDate(`${month}-01`);
  return { start, end: addMonths(start, 1) };
}

function decimalValue(value: Prisma.Decimal | null | undefined) {
  return Number(value?.toString() ?? 0);
}

export async function getNetBalance(upToDate: string, userId: number) {
  const date = utcDate(upToDate);
  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: "INCOME", date: { lte: date } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: "EXPENSE", date: { lte: date } },
    }),
  ]);
  return decimalValue(income._sum.amount) - decimalValue(expense._sum.amount);
}

export async function getMonthSummary(month: string, userId: number) {
  const { start, end } = monthRange(month);
  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: "INCOME", date: { gte: start, lt: end } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    }),
  ]);
  const totalIncome = decimalValue(income._sum.amount);
  const totalExpense = decimalValue(expense._sum.amount);
  return { totalIncome, totalExpense, net: totalIncome - totalExpense };
}

export async function getDailyTotals(month: string, userId: number) {
  const { start, end } = monthRange(month);
  const rows = await prisma.transaction.groupBy({
    by: ["date", "type"],
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
    orderBy: { date: "asc" },
  });
  const totals = new Map<string, { date: string; income: number; expense: number }>();
  for (const row of rows) {
    const date = row.date.toISOString().slice(0, 10);
    const current = totals.get(date) ?? { date, income: 0, expense: 0 };
    current[row.type === "INCOME" ? "income" : "expense"] = decimalValue(row._sum.amount);
    totals.set(date, current);
  }
  return [...totals.values()];
}

export async function getCategoryBreakdown(month: string, userId: number) {
  const { start, end } = monthRange(month);
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });
  const categories = await prisma.category.findMany({
    where: { id: { in: rows.map((row) => row.categoryId) } },
  });
  const names = new Map(categories.map((category) => [category.id, category.name]));
  return rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: names.get(row.categoryId) ?? "Unknown",
    total: decimalValue(row._sum.amount),
  }));
}

export async function getCategories(type?: "EXPENSE" | "INCOME") {
  return prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getTransactions(filters: {
  userId: number;
  month?: string;
  date?: string;
  type?: "EXPENSE" | "INCOME";
  categoryId?: number;
  sort?: "amount_desc" | "amount_asc" | "date_desc";
  house?: "RAYYAN" | "HAMID" | "SHARED";
}) {
  const where: Prisma.TransactionWhereInput = { userId: filters.userId };
  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.house) {
    where.house = filters.house === "SHARED" ? "SHARED" : { in: [filters.house, "SHARED"] };
  }
  if (filters.date) {
    const date = utcDate(filters.date);
    where.date = { gte: date, lt: new Date(date.getTime() + 86400000) };
  } else if (filters.month) {
    const range = monthRange(filters.month);
    where.date = { gte: range.start, lt: range.end };
  }
  const orderBy =
    filters.sort === "amount_desc"
      ? [{ amount: "desc" as const }, { id: "desc" as const }]
      : filters.sort === "amount_asc"
        ? [{ amount: "asc" as const }, { id: "desc" as const }]
        : [{ date: "desc" as const }, { id: "desc" as const }];
  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy,
  });
}

export async function getReport(year: string, userId: number, house?: "RAYYAN" | "HAMID" | "SHARED") {
  const start = utcDate(`${year}-01-01`);
  const end = startOfMonth(addMonths(start, 12));
  const rows = await prisma.transaction.groupBy({
    by: ["categoryId", "date"],
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: start, lt: end },
      house: house
        ? house === "SHARED"
          ? "SHARED"
          : { in: [house, "SHARED"] }
        : undefined,
    },
    _sum: { amount: true },
    orderBy: { date: "asc" },
  });
  const categories = await prisma.category.findMany({
    where: { id: { in: rows.map((row) => row.categoryId) } },
    orderBy: { name: "asc" },
  });
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.categoryId}:${row.date.toISOString().slice(0, 7)}`;
    totals.set(key, (totals.get(key) ?? 0) + decimalValue(row._sum.amount));
  }
  return [...totals.entries()].map(([key, total]) => {
    const [categoryId, month] = key.split(":");
    const id = Number(categoryId);
    return { month, categoryId: id, categoryName: names.get(id) ?? "Unknown", total };
  });
}

export function monthBounds(month: string) {
  const date = utcDate(`${month}-01`);
  return { start: startOfMonth(date), end: endOfMonth(date) };
}
