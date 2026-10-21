import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { applyRazorpayCapture, processRazorpayWebhook } from "../controllers/paymentController.js";
import { verifyRazorpayWebhookSignature } from "../utils/razorpay.js";

const captured = (type = "payment.captured") => ({
  event: type,
  payload: { payment: { entity: { id: "pay_123", order_id: "order_123" } } },
});

test("accepts a valid raw-body webhook signature and rejects tampering", () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
  const body = Buffer.from(JSON.stringify(captured()));
  const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  assert.equal(verifyRazorpayWebhookSignature(body, signature), true);
  assert.equal(verifyRazorpayWebhookSignature(Buffer.from(`${body} `), signature), false);
  assert.equal(verifyRazorpayWebhookSignature(body, "bad"), false);
});

const fakeDb = (initialStatus = "Created", reservationClaim = 1) => {
  const state = { status: initialStatus, orderStatus: "Payment Pending", finalized: false, eventIds: new Set(), stockDecrements: 0 };
  const tx = {
    razorpayWebhookEvent: { create: async ({ data }) => {
      if (state.eventIds.has(data.eventId)) { const e = new Error("duplicate"); e.code = "P2002"; throw e; }
      state.eventIds.add(data.eventId);
    } },
    payment: {
      findUnique: async () => ({ id: "payment_1", orderId: "order_1", status: state.status, order: { userId: "user_1", reservationId: "reservation_1" } }),
      updateMany: async ({ where, data }) => {
        const accepted = Array.isArray(where.status?.in) ? where.status.in.includes(state.status) : where.status === state.status;
        if (!accepted) return { count: 0 };
        state.status = data.status;
        return { count: 1 };
      },
    },
    stockReservation: { updateMany: async () => {
      if (!reservationClaim || state.finalized) return { count: 0 };
      state.finalized = true;
      return { count: 1 };
    } },
    order: {
      update: async ({ data }) => { state.orderStatus = data.status; },
      findUnique: async () => ({ id: "order_1", status: state.orderStatus, payment: { status: state.status } }),
    },
    cart: { findUnique: async () => null },
    cartItem: { deleteMany: async () => ({ count: 0 }) },
  };
  return { state, $transaction: (fn) => fn(tx) };
};

test("captured payment marks payment paid, confirms order, and never decrements stock", async () => {
  const db = fakeDb();
  await processRazorpayWebhook(db, "evt_capture", captured());
  assert.equal(db.state.status, "Paid");
  assert.equal(db.state.orderStatus, "Confirmed");
  assert.equal(db.state.finalized, true);
  assert.equal(db.state.stockDecrements, 0);
});

test("backend signature verification uses the same idempotent capture update as the webhook", async () => {
  const db = fakeDb();
  await db.$transaction((tx) => applyRazorpayCapture(tx, {
    paymentId: "payment_1", orderId: "order_1", userId: "user_1",
    reservationId: "reservation_1", razorpayPaymentId: "pay_123",
  }));
  assert.equal(db.state.status, "Paid");
  assert.equal(db.state.orderStatus, "Confirmed");
  await db.$transaction((tx) => applyRazorpayCapture(tx, {
    paymentId: "payment_1", orderId: "order_1", userId: "user_1",
    reservationId: "reservation_1", razorpayPaymentId: "pay_123",
  }));
  assert.equal(db.state.stockDecrements, 0);
});

test("failed payment marks payment and order failed", async () => {
  const db = fakeDb();
  await processRazorpayWebhook(db, "evt_failed", captured("payment.failed"));
  assert.equal(db.state.status, "Failed");
  assert.equal(db.state.orderStatus, "Payment Failed");
});

test("duplicate webhook event is idempotently rejected by event ID", async () => {
  const db = fakeDb();
  await processRazorpayWebhook(db, "evt_repeat", captured());
  await assert.rejects(processRazorpayWebhook(db, "evt_repeat", captured()), { code: "P2002" });
  assert.equal(db.state.status, "Paid");
  assert.equal(db.state.eventIds.size, 1);
});
