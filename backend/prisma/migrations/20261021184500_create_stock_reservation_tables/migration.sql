CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReservationItem" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD COLUMN "reservationId" TEXT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Order_reservationId_key" ON "Order"("reservationId");
CREATE INDEX "StockReservation_expiresAt_releasedAt_idx" ON "StockReservation"("expiresAt", "releasedAt");
