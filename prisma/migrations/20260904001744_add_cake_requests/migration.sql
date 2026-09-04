-- CreateTable
CREATE TABLE "CakeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cakeSize" TEXT NOT NULL,
    "flavor" TEXT NOT NULL,
    "design" TEXT NOT NULL,
    "message" TEXT,
    "requiredDate" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "fulfillment" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "deliveryChargeApplicable" BOOLEAN NOT NULL DEFAULT false,
    "eggless" BOOLEAN NOT NULL DEFAULT true,
    "vegetarian" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CakeRequest_userId_idx" ON "CakeRequest"("userId");

-- CreateIndex
CREATE INDEX "CakeRequest_status_idx" ON "CakeRequest"("status");

-- CreateIndex
CREATE INDEX "CakeRequest_requiredDate_idx" ON "CakeRequest"("requiredDate");
