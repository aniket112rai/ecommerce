import { prisma } from "../utils/prismaClient.js";
import { releaseExpiredReservations } from "../utils/inventoryReservations.js";
import {
  getRazorpayInstance,
  getRazorpayKeyId,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../utils/razorpay.js";

export const applyRazorpayCapture = async (tx, { paymentId, orderId, userId, reservationId, razorpayPaymentId }) => {
  const updated = await tx.payment.updateMany({
    where: { id: paymentId, status: { in: ["Created", "Expired", "Failed"] } },
    data: { status: "Paid", razorpayPaymentId },
  });
  if (updated.count) {
    let finalized = false;
    if (reservationId) {
      const claim = await tx.stockReservation.updateMany({
        where: { id: reservationId, releasedAt: null, finalizedAt: null },
        data: { finalizedAt: new Date() },
      });
      finalized = claim.count === 1;
    }
    await tx.order.update({ where: { id: orderId }, data: { status: finalized ? "Confirmed" : "Payment Review" } });
    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  } else {
    const latest = await tx.payment.findUnique({ where: { id: paymentId } });
    if (latest?.status !== "Paid") throw new Error("Payment is already being processed");
  }
  return tx.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
};

// POST /api/payments/razorpay/order
export const createRazorpayOrder = async (req, res) => {
  try {
    await releaseExpiredReservations();
    const { addressId, paymentMethod = "Razorpay", reservationId } = req.body;
    const userId = req.userId;
    if (!reservationId) return res.status(400).json({ message: "Checkout reservation is missing. Return to checkout." });
    const [address, reservation] = await Promise.all([
      prisma.address.findFirst({ where: { id: addressId, userId } }),
      prisma.stockReservation.findFirst({
        where: { id: reservationId, userId, expiresAt: { gt: new Date() }, releasedAt: null, finalizedAt: null },
        include: { items: { include: { product: true } } },
      }),
    ]);
    if (!address) return res.status(400).json({ message: "Invalid address selected" });
    if (!reservation) return res.status(409).json({ message: "Your stock reservation expired. Please return to checkout." });
    const result = await prisma.$transaction(async (tx) => {
      // Serialize duplicate order-initiation requests for this reservation.
      // This protects the external Razorpay create call as well as our unique
      // Order.reservationId constraint.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${reservation.id}))`;

      const existingOrder = await tx.order.findUnique({
        where: { reservationId: reservation.id },
        include: { items: { include: { product: true } }, address: true, payment: true },
      });
      if (existingOrder) {
        if (existingOrder.payment?.status === "Paid") {
          const error = new Error("This checkout has already been paid.");
          error.statusCode = 409;
          throw error;
        }
        const stillReserved = await tx.stockReservation.findFirst({
          where: { id: reservation.id, userId, expiresAt: { gt: new Date() }, releasedAt: null, finalizedAt: null },
          select: { id: true },
        });
        if (!stillReserved) {
          const error = new Error("Your stock reservation expired. Please return to checkout.");
          error.statusCode = 409;
          throw error;
        }
        if (!existingOrder.payment?.razorpayOrderId) {
          throw new Error("Existing checkout order is missing its Razorpay order ID.");
        }
        return {
          order: existingOrder,
          razorpayOrder: {
            id: existingOrder.payment.razorpayOrderId,
            amount: Math.round(existingOrder.payment.amount * 100),
            currency: "INR",
          },
          reused: true,
        };
      }

      const currentReservation = await tx.stockReservation.findFirst({
        where: { id: reservation.id, userId, expiresAt: { gt: new Date() }, releasedAt: null, finalizedAt: null },
        include: { items: { include: { product: true } } },
      });
      if (!currentReservation) {
        const error = new Error("Your stock reservation expired. Please return to checkout.");
        error.statusCode = 409;
        throw error;
      }
      const itemsToCreate = currentReservation.items.map(({ productId, quantity, product }) => ({ productId, quantity, price: product.price }));
      const total = itemsToCreate.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const razorpay = getRazorpayInstance();
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        // Razorpay requires receipts to be unique. A deterministic receipt
        // gives retries a stable gateway reference for this reservation.
        receipt: `rcpt_${currentReservation.id}`,
        notes: { userId, paymentMethod, reservationId: currentReservation.id },
      });

      const order = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          total,
          status: "Payment Pending",
          reservation: { connect: { id: currentReservation.id } },
          address: { connect: { id: addressId } },
          payment: { create: {
            provider: "Razorpay",
            status: "Created",
            amount: total,
            razorpayOrderId: razorpayOrder.id,
          } },
          items: { create: itemsToCreate },
        },
        include: { items: { include: { product: true } }, address: true, payment: true },
      });
      return { order, razorpayOrder, reused: false };
    }, { maxWait: 10_000, timeout: 30_000 });

    res.status(result.reused ? 200 : 201).json({
      key: getRazorpayKeyId(),
      order: result.order,
      reservationExpiresAt: reservation.expiresAt,
      razorpayOrder: {
        id: result.razorpayOrder.id,
        amount: result.razorpayOrder.amount,
        currency: result.razorpayOrder.currency,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: "Error creating Razorpay order",
      error: err.message,
    });
  }
};

// POST /api/payments/razorpay/verify
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing Razorpay verification details" });
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.userId,
        payment: { razorpayOrderId },
      },
      include: { items: true, payment: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found for this payment" });
    }
    if (order.payment.status === "Paid") return res.json(order);

    // Signature proves the checkout response is authentic. Fetch the payment
    // from Razorpay as well so only a captured payment confirms the order.
    const gatewayPayment = await getRazorpayInstance().payments.fetch(razorpayPaymentId);
    if (gatewayPayment.order_id !== razorpayOrderId || gatewayPayment.status !== "captured") {
      return res.status(409).json({ message: "Razorpay has not captured this payment yet" });
    }
    if (gatewayPayment.amount !== Math.round(order.payment.amount * 100)) {
      return res.status(400).json({ message: "Payment amount does not match the order" });
    }

    const confirmedOrder = await prisma.$transaction((tx) => applyRazorpayCapture(tx, {
      paymentId: order.payment.id,
      orderId: order.id,
      userId: order.userId,
      reservationId: order.reservationId,
      razorpayPaymentId,
    }));
    res.json(confirmedOrder);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: "Error verifying payment", error: err.message });
  }
};

export const processRazorpayWebhook = async (db, eventId, event) => db.$transaction(async (tx) => {
      await tx.razorpayWebhookEvent.create({ data: { eventId, event: event.event } });
      const entity = event.payload?.payment?.entity;
      const razorpayOrderId = entity?.order_id;
      if (!razorpayOrderId) throw new Error("Webhook payment is missing order_id");
      const payment = await tx.payment.findUnique({ where: { razorpayOrderId }, include: { order: true } });
      if (!payment) throw new Error("No payment matches Razorpay order");

      if (event.event === "payment.captured") {
        await applyRazorpayCapture(tx, {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.order.userId,
          reservationId: payment.order.reservationId,
          razorpayPaymentId: entity.id,
        });
      } else {
        const updated = await tx.payment.updateMany({
          where: { id: payment.id, status: "Created" },
          data: { status: "Failed", razorpayPaymentId: entity.id || undefined },
        });
        if (updated.count) await tx.order.update({ where: { id: payment.orderId }, data: { status: "Payment Failed" } });
      }
    });

export const handleRazorpayWebhook = async (req, res) => {
  if (!verifyRazorpayWebhookSignature(req.rawBody, req.get("X-Razorpay-Signature"))) {
    return res.status(400).json({ message: "Invalid Razorpay webhook signature" });
  }
  const eventId = req.get("x-razorpay-event-id");
  if (!eventId) return res.status(400).json({ message: "Missing Razorpay event ID" });
  let event;
  try { event = JSON.parse(req.rawBody.toString("utf8")); }
  catch { return res.status(400).json({ message: "Invalid webhook payload" }); }
  if (!["payment.captured", "payment.failed"].includes(event.event)) return res.sendStatus(200);

  try {
    await processRazorpayWebhook(prisma, eventId, event);
    return res.sendStatus(200);
  } catch (err) {
    if (err.code === "P2002") return res.sendStatus(200); // already claimed event ID
    console.error("Razorpay webhook processing failed:", err);
    return res.sendStatus(500); // Razorpay retries transient/unhandled deliveries
  }
};

// POST /api/payments
export const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    // Fetch order to get amount
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // TODO: Integrate actual payment gateway (Razorpay)
    const payment = await prisma.payment.create({
      data: {
        orderId,
        provider: paymentMethod,
        status: "completed", // for now, assume success
        amount: order.total,
      },
    });

    // Optionally update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "shipped" }, // or keep as pending
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error processing payment", error: err.message });
  }
};

// GET /api/payments/:id
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching payment", error: err.message });
  }
};
