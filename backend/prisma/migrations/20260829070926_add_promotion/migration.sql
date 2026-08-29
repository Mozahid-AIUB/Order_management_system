-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED', 'WEIGHTED');

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "percentageValue" DECIMAL(5,2),
    "fixedValue" DECIMAL(10,2),
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionSlab" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "minWeight" INTEGER NOT NULL,
    "maxWeight" INTEGER,
    "discountPerUnit" DECIMAL(10,2) NOT NULL,
    "unitWeight" INTEGER NOT NULL DEFAULT 500,

    CONSTRAINT "PromotionSlab_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromotionSlab" ADD CONSTRAINT "PromotionSlab_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
