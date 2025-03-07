/*
  Warnings:

  - You are about to drop the column `networkFee` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "networkFee";
