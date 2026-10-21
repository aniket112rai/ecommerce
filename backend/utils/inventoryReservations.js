import { prisma } from "./prismaClient.js";

export const RESERVATION_DURATION_MS = 10 * 60 * 1000;

export const reserveInventory = async (tx, items) => {
  for (const item of items) {
    const updated = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (updated.count !== 1) {
      const error = new Error("Product stock changed or is reserved. Please review your cart and try again.");
      error.statusCode = 409;
      throw error;
    }
  }
};

// Claim each expired reservation before restoring stock, so concurrent sweepers
// and payment verification cannot release/finalize the same inventory twice.
export const releaseExpiredReservations = async (db = prisma, now = new Date()) => {
  const expired = await db.stockReservation.findMany({
    where: {
      expiresAt: { lte: now },
      releasedAt: null,
      finalizedAt: null,
    },
    select: { id: true, items: { select: { productId: true, quantity: true } } },
  });

  for (const order of expired) {
    await db.$transaction(async (tx) => {
      const claimed = await tx.stockReservation.updateMany({
        where: {
          id: order.id,
          expiresAt: { lte: now },
          releasedAt: null,
          finalizedAt: null,
        },
        data: { releasedAt: now },
      });
      if (claimed.count !== 1) return;

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      const linkedOrder = await tx.order.findUnique({
        where: { reservationId: order.id }, select: { id: true },
      });
      if (linkedOrder) {
        await tx.order.update({ where: { id: linkedOrder.id }, data: { status: "Payment Expired" } });
        await tx.payment.updateMany({
          where: { orderId: linkedOrder.id, status: "Created" },
        data: { status: "Expired" },
        });
      }
    });
  }
};
