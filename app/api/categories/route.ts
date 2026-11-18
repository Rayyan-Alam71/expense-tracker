import { prisma } from "@/lib/prisma";
import { errorMessage, errorResponse, isPrismaKnownError } from "@/lib/api";
import { getCategories } from "@/lib/queries";
import { categorySchema } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const session = getAuthenticatedUser(request);
  if (!session) return errorResponse("Please sign in", 401);
  const type = new URL(request.url).searchParams.get("type");
  if (type && type !== "EXPENSE" && type !== "INCOME") {
    return errorResponse("Invalid category type", 400);
  }
  try {
    return Response.json(await getCategories(type as "EXPENSE" | "INCOME" | undefined));
  } catch (error) {
    return errorResponse(errorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  const session = getAuthenticatedUser(request);
  if (!session) return errorResponse("Please sign in", 401);
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "Invalid category", 400);
  try {
    const category = await prisma.category.create({ data: parsed.data });
    return Response.json(category, { status: 201 });
  } catch (error) {
    if (isPrismaKnownError(error, "P2002")) {
      return errorResponse("A category with this name already exists for this type", 409);
    }
    return errorResponse(errorMessage(error), 500);
  }
}
