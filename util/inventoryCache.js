import { redis } from "./redis.js";
import Product from "../models/product.model.js";

export const getProductStock = async (productId) => {
  const key = `product:${productId}:stock`;

  const cached = await redis.get(key);
  if (cached !== null) return parseInt(cached);

  const product = await Product.findById(productId).select("countInStock");
  await redis.set(key, product.countInStock); // cache store

  return product.countInStock;
};

export const updateProductCache = async (productId) => {
  const product = await Product.findById(productId).select("countInStock");
  await redis.set(`product:${productId}:stock`, product.countInStock);
};
