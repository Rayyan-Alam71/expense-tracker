import { prisma } from "@/lib/prisma";
import { errorMessage, errorResponse, serializeTransaction } from "@/lib/api";
import { getTransactions } from "@/lib/queries";
import { isValidDate, isValidMonth, transactionSchema } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";

function validSort(value: string | null) {
  return value === "amount_desc" || value === "amount_asc" || value === "date_desc"
    ? value
    : value === null ? "date_desc" : null;
}

async function validateTransaction(data: {
  type: "EXPENSE" | "INCOME";
  categoryId: number;
  date: string;
  tenantName?: string | null;
}) {
  if (!isValidDate(data.date)) return "Date is not valid";
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return "Category does not exist";
  if (category.type !== data.type) return "Category type must match transaction type";
  if (category.name === "Rent" && data.type === "INCOME" && !data.tenantName?.trim()) {
    return "Tenant name is required for Rent income";
  }
  return null;
}

export async function GET(request: Request) {
  const session = getAuthenticatedUser(request);
  if (!session) return errorResponse("Please sign in", 401);
  const params = new URL(request.url).searchParams;
  const month = params.get("month");
  const date = params.get("date");
  const sort = validSort(params.get("sort"));
  const type = params.get("type");
  const categoryId = params.get("categoryId");
  const house = params.get("house");
  if ((!month && !date) || (month && !isValidMonth(month)) || (date && !isValidDate(date))) {
    return errorResponse("Provide a valid month or date", 400);
  }
  if (categoryId && (!/^\d+$/.test(categoryId) || Number(categoryId) < 1)) {
    return errorResponse("Invalid category filter", 400);
  }
  if (!sort || (type && type !== "EXPENSE" && type !== "INCOME")) {
    return errorResponse("Invalid transaction filter", 400);
  }
  if (house && house !== "RAYYAN" && house !== "HAMID" && house !== "SHARED") {
    return errorResponse("Invalid house filter", 400);
  }
  try {
    const transactions = await getTransactions({
      userId: session.id,
      month: month ?? undefined,
      date: date ?? undefined,
      type: type as "EXPENSE" | "INCOME" | undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      house: house as "RAYYAN" | "HAMID" | "SHARED" | undefined,
      sort,
    });
    return Response.json(transactions.map(serializeTransaction));
  } catch (error) {
    return errorResponse(errorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  const session = getAuthenticatedUser(request);
  if (!session) return errorResponse("Please sign in", 401);
  const parsed = transactionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "Invalid transaction", 400);
  const data = parsed.data;
  try {
    const validationError = await validateTransaction(data);
    if (validationError) return errorResponse(validationError, 400);
    const category = await prisma.category.findUniqueOrThrow({ where: { id: data.categoryId } });
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.id,
        type: data.type,
        amount: data.amount,
        date: new Date(`${data.date}T00:00:00.000Z`),
        categoryId: data.categoryId,
        description: data.description?.trim() || null,
        tenantName: category.name === "Rent" ? data.tenantName?.trim() : null,
        house: data.type === "EXPENSE" ? data.house ?? null : null,
      },
      include: { category: true },
    });
    return Response.json(serializeTransaction(transaction), { status: 201 });
  } catch (error) {
    return errorResponse(errorMessage(error), 500);
  }
}
