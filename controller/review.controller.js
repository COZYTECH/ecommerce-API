import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";

export const addReview = async (req, res) => {
  try {
    const { productId } = req.params.productId;
    const { rating, comment } = req.body;
    const userId = req.user.id || req.user.userId;

    const existing = await Review.findOne({ user: userId, product: productId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "You already reviewed this product" });
    }

    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });
    await review.save();

    // Aggregate stats
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: stats[0].avgRating,
        totalReviews: stats[0].count,
      });
    }

    res.json({ message: "Review added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
