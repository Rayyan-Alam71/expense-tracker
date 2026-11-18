import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const categories = [
  ["Medicine", "EXPENSE"], ["Doctor", "EXPENSE"], ["Stationery", "EXPENSE"],
  ["Grocery", "EXPENSE"], ["Electricity Bill", "EXPENSE"], ["Milkman Bill", "EXPENSE"],
  ["Miscellaneous", "EXPENSE"], ["Rent", "INCOME"], ["Salary", "INCOME"],
  ["Previous Owes", "INCOME"], ["Other", "INCOME"],
] as const;

async function main() {
  for (const [name, type] of categories) {
    await prisma.category.upsert({
      where: { name_type: { name, type } },
      update: {},
      create: { name, type },
    });
  }
}

main().finally(() => prisma.$disconnect());
