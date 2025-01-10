/*
  Warnings:

  - You are about to drop the column `amount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `tokenAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `buyerId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `listingId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `units` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EnergyType" AS ENUM ('SOLAR', 'WIND', 'HYDRO', 'BIOMASS', 'GEOTHERMAL');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('GRID', 'DIRECT', 'HYBRID');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'UTILITY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'PENDING', 'SOLD_OUT', 'CANCELLED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amount",
DROP COLUMN "tokenAmount",
DROP COLUMN "type",
DROP COLUMN "userId",
ADD COLUMN     "buyerId" TEXT NOT NULL,
ADD COLUMN     "listingId" TEXT NOT NULL,
ADD COLUMN     "pricePerUnit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "units" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "EnergyListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "energyType" "EnergyType" NOT NULL,
    "location" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "totalCapacity" DOUBLE PRECISION NOT NULL,
    "availableUnits" DOUBLE PRECISION NOT NULL,
    "minPurchase" DOUBLE PRECISION NOT NULL,
    "maxPurchase" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "certification" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "EnergyListing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnergyListing" ADD CONSTRAINT "EnergyListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "EnergyListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
