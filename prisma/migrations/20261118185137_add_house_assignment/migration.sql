-- CreateEnum
CREATE TYPE "HouseScope" AS ENUM ('RAYYAN', 'HAMID', 'SHARED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "house" "HouseScope";
