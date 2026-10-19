// backend/controllers/orderController.js
import { prisma } from "../utils/prismaClient.js";
import { refundRazorpayPayment } from "../utils/razorpay.js";

const paidStatuses = ["paid", "completed"];

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isPaid = (payment) => paidStatuses.includes(payment?.status?.toLowerCase());

const getRefundErrorMessage = (err) =>
  err.error?.description || err.error?.reason || err.message || "Razorpay refund failed";

// Claims a paid Razorpay payment before contacting the gateway. This makes a
// second cancel request see "Processing" instead of issuing another refund.
const claimRefund = async (payment) => {
  const claim = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      status: { in: ["Paid", "paid", "Completed", "completed"] },
      OR: [
        { refundStatus: null },
        { refundStatus: { startsWith: "Failed:" } },
      ],
      razorpayRefundId: null,
    },
    data: { refundStatus: "Processing" },
  });

  if (claim.count === 1) return;

  const latestPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
  if (latestPayment?.refundStatus === "Processing") {
    throw createHttpError(409, "Refund is already being processed for this order");
  }
  if (latestPayment?.status === "Refunded") {
    throw createHttpError(409, "This payment has already been refunded");
  }
  throw createHttpError(409, "This payment is not eligible for a refund");
};

const refundPaidRazorpayPayment = async (payment) => {
  await claimRefund(payment);

  try {
    const refund = await refundRazorpayPayment({
      paymentId: payment.razorpayPaymentId,
      amount: payment.amount,
    });
    return refund;
  } catch (err) {
    const refundError = getRefundErrorMessage(err);
    console.error("Razorpay refund failed:", {
      paymentId: payment.razorpayPaymentId,
      refundError,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { refundStatus: `Failed: ${refundError}`.slice(0, 250) },
    });

    throw createHttpError(502, `Refund failed: ${refundError}`);
  }
};

const cancelOrderAndHandleRefund = async (order) => {
  const currentStatus = order.status?.toLowerCase();
  if (currentStatus === "cancelled") {
    throw createHttpError(400, "Order is already cancelled");
  }
  if (["shipped", "delivered"].includes(currentStatus)) {
    throw createHttpError(400, "Shipped or delivered orders cannot be cancelled");
  }

  let refund = null;
  if (isPaid(order.payment)) {
    if (order.payment.provider !== "Razorpay" || !order.payment.razorpayPaymentId) {
      throw createHttpError(409, "This paid payment cannot be refunded automatically");
    }

    // If Razorpay rejects the refund, this throws before order status or stock changes.
    refund = await refundPaidRazorpayPayment(order.payment);
  }

  const shouldRestock = currentStatus !== "payment pending";

  try {
    return await prisma.$transaction(async (tx) => {
      if (shouldRestock) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      if (order.payment) {
        const paymentUpdate = refund
          ? {
              status: refund.status === "processed" ? "Refunded" : "Refund Pending",
              razorpayRefundId: refund.id,
              refundStatus: refund.status || "Processing",
            }
          : {
              status: isPaid(order.payment) ? order.payment.status : "Cancelled",
              razorpayRefundId: order.payment.razorpayRefundId,
              refundStatus: order.payment.refundStatus,
            };

        await tx.payment.update({
          where: { id: order.payment.id },
          data: paymentUpdate,
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: "Cancelled" },
        include: {
          items: { include: { product: true } },
          address: true,
          payment: true,
        },
      });
    });
  } catch (err) {
    // The external refund may already have succeeded. Persist that fact so a retry
    // cannot issue another refund, even if the order-update transaction failed.
    if (refund) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: refund.status === "processed" ? "Refunded" : "Refund Pending",
          razorpayRefundId: refund.id,
          refundStatus: `Gateway refund ${refund.status || "Processing"}; order update failed`.slice(0, 250),
        },
      }).catch(() => {});
    }
    throw err;
  }
};

// GET /api/orders - user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};
 // backend/controllers/orderController.js

// GET /api/admin/orders - all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // console.dir(orders, { depth: null });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all orders", error: err.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
        payment: true,
      },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only owner or admin can access
    if (order.userId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order", error: err.message });
  }
};

// POST /api/orders - create order
export const createOrder = async (req, res) => {
  try {
    const { items, addressId, paymentMethod } = req.body;
    const userId = req.userId;
    const selectedPaymentMethod = paymentMethod || "COD";

    if (selectedPaymentMethod !== "COD") {
      return res.status(400).json({
        message: "Online payments must be completed through Razorpay",
      });
    }

    if (!items?.length || !addressId) {
      return res.status(400).json({ message: "Missing order details" });
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      return res.status(400).json({ message: "Invalid address selected" });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, stock: true, name: true },
    });

    const itemsToCreate = items.map((item) => {
      const quantity = parseInt(item.quantity, 10);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Invalid item quantity");
      }

      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.stock < quantity) {
        throw new Error(`Only ${product.stock} item(s) left for ${product.name}`);
      }

      return {
        productId: item.productId,
        quantity,
        price: product.price,
      };
    });

    const total = itemsToCreate.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const item of itemsToCreate) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new Error("Product stock changed. Please review your cart and try again.");
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          total,
          status: "Confirmed",
          address: { connect: { id: addressId } },
          payment: {
            create: {
              provider: selectedPaymentMethod,
              status: "COD Pending",
              amount: total,
            },
          },
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: { include: { product: true } },
          address: true,
          payment: true,
        },
      });

      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return createdOrder;
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation failed:", err);
    res.status(400).json({ message: "Order creation failed", error: err.message });
  }
};

// PUT /api/orders/:id/cancel - user can cancel own non-shipped order

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const cancelledOrder = await cancelOrderAndHandleRefund(order);

    res.json(cancelledOrder);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: "Error cancelling order", error: err.message });
  }
};

// PUT /api/orders/:id/status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!existingOrder) return res.status(404).json({ message: "Order not found" });

    const nextStatus = status?.toLowerCase();
    if (nextStatus === "cancelled") {
      const order = await cancelOrderAndHandleRefund(existingOrder);

      return res.json(order);
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } }, address: true, payment: true },
    });

    res.json(order);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: "Error updating order status", error: err.message });
  }
};
