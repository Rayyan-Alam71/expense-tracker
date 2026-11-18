import { Prisma } from "@/app/generated/prisma/client";

export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function serializeTransaction<T extends {
  amount: { toString(): string };
  date: Date;
  category?: { id: number; name: string; type: string };
}>(transaction: T) {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
    date: transaction.date.toISOString().slice(0, 10),
  };
}

export function isPrismaKnownError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export function errorMessage(error: unknown) {
  void error;
  return "An unexpected error occurred. Please try again.";
}
