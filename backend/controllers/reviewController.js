import prisma from "../utils/prismaClient.js";

// GET /api/reviews/:productId
export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
};

// POST /api/reviews
export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Optional: check if user has purchased this product
    // const hasPurchased = await prisma.orderItem.findFirst({
    //   where: { productId, order: { userId: req.userId } }
    // });
    // if (!hasPurchased) return res.status(400).json({ message: "You can only review purchased products" });

    const review = await prisma.review.create({
      data: {
        userId: req.userId,
        productId,
        rating,
        comment,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Error adding review", error: err.message });
  }
};

// DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Only admin or owner can delete
    if (req.role !== "admin" && review.userId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await prisma.review.delete({ where: { id } });

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting review", error: err.message });
  }
};
