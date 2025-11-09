// backend/controllers/orderController.js
import { prisma } from "../utils/prismaClient.js";

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
    // Expect body: { items: [{ productId, quantity }], addressId }
    const { items = [], addressId } = req.body;
    const userId = req.userId; // ← from authMiddleware

    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Fetch product details for the given productIds
    const productIds = [...new Set(items.map((it) => it.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, name: true },
    });

    // Build a map for quick lookup
    const prodMap = new Map(products.map((p) => [p.id, p]));

    // Validate all product ids exist and build items with price
    let total = 0;
    const itemsToCreate = items.map((it) => {
      const product = prodMap.get(it.productId);
      if (!product) {
        throw new Error(`Product not found: ${it.productId}`);
      }
      const qty = Number(it.quantity) || 1;
      const price = Number(product.price) || 0;
      total += price * qty;
      return {
        productId: it.productId,
        quantity: qty,
        price,
      };
    });

    // Create order (do NOT create payment here — payment endpoint will handle it)
    const order = await prisma.order.create({
      data: {
        user: { connect: { id: userId } }, // ✅ FIXED — connect relation properly
        total,
        status: "pending",
        address: addressId ? { connect: { id: addressId } } : undefined,
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
    

    // return order to frontend
    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation failed:", err);
    // If the error is a product-not-found error we threw, return 400
    if (err.message && err.message.startsWith("Product not found")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Order creation failed", error: err.message });
  }
};

// PUT /api/orders/:id/status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { product: true } }, address: true, payment: true },
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error updating order status", error: err.message });
  }
};
