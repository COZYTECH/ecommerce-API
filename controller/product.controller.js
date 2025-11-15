import { productSchema } from "../middleware/schema.validation.js";
import Product from "../models/product.model.js";

export const createProduct = async (req, res) => {
  // Logic to create a new product
  const { name, description, price, category, countInStock } = req.body;
  const { error } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const product = new Product({
      name,
      description,
      price,
      category,
      countInStock,
    });
    const createProduct = await product.save();
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      createProduct,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
