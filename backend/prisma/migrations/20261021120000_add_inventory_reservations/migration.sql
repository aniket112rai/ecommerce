ALTER TABLE "Order"
ADD COLUMN "reservationExpiresAt" TIMESTAMP(3),
ADD COLUMN "inventoryFinalizedAt" TIMESTAMP(3),
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3);

CREATE INDEX "Order_reservationExpiresAt_inventoryReleasedAt_idx"
ON "Order"("reservationExpiresAt", "inventoryReleasedAt");
