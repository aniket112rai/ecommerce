import test from "node:test";
import assert from "node:assert/strict";
import { reserveInventory, releaseExpiredReservations, RESERVATION_DURATION_MS } from "../utils/inventoryReservations.js";

test("inventory reservation decrements stock with an atomic availability condition", async () => {
  const calls = [];
  const tx = { product: { updateMany: async (args) => { calls.push(args); return { count: 1 }; } } };
  await reserveInventory(tx, [{ productId: "p1", quantity: 2 }]);
  assert.deepEqual(calls[0].where.stock, { gte: 2 });
  assert.deepEqual(calls[0].data.stock, { decrement: 2 });
  assert.equal(RESERVATION_DURATION_MS, 600_000);
});

test("reservation fails when another checkout has consumed the remaining stock", async () => {
  const tx = { product: { updateMany: async () => ({ count: 0 }) } };
  await assert.rejects(() => reserveInventory(tx, [{ productId: "p1", quantity: 1 }]), /reserved/);
});

test("expired inventory is restored only when the order release claim succeeds", async () => {
  let restored = 0;
  const db = {
    stockReservation: {
      findMany: async () => [{ id: "o1", items: [{ productId: "p1", quantity: 3 }] }],
      updateMany: async () => ({ count: 1 }),
    },
    $transaction: async (fn) => fn({
      stockReservation: { updateMany: async () => ({ count: 1 }) },
      product: { update: async ({ data }) => { restored += data.stock.increment; } },
      order: { findUnique: async () => null },
    }),
  };
  await releaseExpiredReservations(db, new Date("2026-01-01T00:10:00Z"));
  assert.equal(restored, 3);

  db.$transaction = async (fn) => fn({
    stockReservation: { updateMany: async () => ({ count: 0 }) },
    product: { update: async () => { restored += 3; } },
    order: { findUnique: async () => null },
  });
  await releaseExpiredReservations(db, new Date("2026-01-01T00:10:00Z"));
  assert.equal(restored, 3);
});
