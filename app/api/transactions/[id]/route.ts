import { prisma } from "@/lib/prisma";
import { errorMessage, errorResponse, isPrismaKnownError, serializeTransaction } from "@/lib/api";
import { transactionSchema } from "@/lib/validators";
import { isValidDate } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = getAuthenticatedUser(request);
  if (!session) return errorResponse("Please sign in", 401);
  const id = Number((await context.params).id);
  const parsed = transactionSchema.partial().safeParse(await request.json().catch(() => null));
  if (!Number.isInteger(id) || id < 1) return errorResponse("Invalid transaction id", 400);
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "Invalid transaction", 400);
  try {
    const existing = await prisma.transaction.findUnique({ where: { id, userId: session.id }, include: { category: true } });
    if (!existing) return errorResponse("Transaction not found", 404);
    const type = parsed.data.type ?? existing.type;
    const categoryId = parsed.data.categoryId ?? existing.categoryId;
    const date = parsed.data.date ?? existing.date.toISOString().slice(0, 10);
    const tenantName = parsed.data.tenantName === undefined ? existing.tenantName : parsed.data.tenantName;
    const description = parsed.data.description === undefined ? existing.description : parsed.data.description;
    const amount = parsed.data.amount ?? existing.amount.toString();
    const house = parsed.data.house === undefined ? existing.house : parsed.data.house;
    if (!isValidDate(date)) return errorResponse("Date is not valid", 400);
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return errorResponse("Category does not exist", 400);
    if (category.type !== type) return errorResponse("Category type must match transaction type", 400);
    if (category.name === "Rent" && type === "INCOME" && !tenantName?.trim()) {
      return errorResponse("Tenant name is required for Rent income", 400);
    }
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount,
        date: new Date(`${date}T00:00:00.000Z`),
        categoryId,
        description: description?.trim() || null,
        tenantName: category.name === "Rent" ? tenantName?.trim() : null,
        house: type === "EXPENSE" ? house ?? null : null,
      },
      include: { category: true },
    });
    return Response.json(serializeTransaction(transaction));
  } catch (error) {
    if (isPrismaKnownError(error, "P2025")) return errorResponse("Transaction not found", 404);
    return errorResponse(errorMessage(error), 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = getAuthenticatedUser(_request);
  if (!session) return errorResponse("Please sign in", 401);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return errorResponse("Invalid transaction id", 400);
  try {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.id) return errorResponse("Transaction not found", 404);
    await prisma.transaction.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    if (isPrismaKnownError(error, "P2025")) return errorResponse("Transaction not found", 404);
    return errorResponse(errorMessage(error), 500);
  }
}
