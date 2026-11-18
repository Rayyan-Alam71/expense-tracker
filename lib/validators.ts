import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;

export const typeSchema = z.enum(["EXPENSE", "INCOME"]);
export const houseScopeSchema = z.enum(["RAYYAN", "HAMID", "SHARED"]);

export const transactionSchema = z.object({
  type: typeSchema,
  amount: z.union([z.string(), z.number()]).transform(String).refine(
    (value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0,
    "Amount must be greater than zero with at most two decimal places",
  ),
  date: z.string().regex(datePattern, "Date must use YYYY-MM-DD"),
  categoryId: z.coerce.number().int().positive(),
  description: z.string().max(200).optional().nullable(),
  tenantName: z.string().max(100).optional().nullable(),
  house: houseScopeSchema.optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: typeSchema,
});

export function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidMonth(value: string) {
  if (!monthPattern.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

export function isValidYear(value: string) {
  return /^\d{4}$/.test(value) && Number(value) >= 1970 && Number(value) <= 9999;
}
