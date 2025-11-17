import { productSchema } from "../middleware/schema.validation.js";
import Product from "../models/product.model.js";
import uploadToCloudinary from "../util/uploadToCloudinary.js";
import cloudinary from "../util/cloudinary.js";

export const createProduct = async (req, res) => {
  // Logic to create a new product
  const {
    name,
    description,
    price,
    category,
    countInStock,
    images,
    brand,
    rating,
    totalReviews,
  } = req.body;
  const { error } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    let imagesArray = [];
    // if (req.files) {
    //   req.files.forEach((file) => {
    //     imagesArray.push({
    //       url: file.path,
    //       public_id: file.filename,
    //     });
    //   });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file.buffer, "products");

        imagesArray.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
      }
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      countInStock,
      images: imagesArray,
      brand,
      rating,
      totalReviews,
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

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      limit = 20,
      page = 1,
    } = req.query;

    let query = {};

    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// export const getProductById = async (req, res) => {
//   // Logic to get a product by ID
//   const { id } = req.params;
//   try {
//     const product = await Product.findById(id);
//     if (!product) {
//       return res.status(404).json({ error: "Product not found" });
//     }
//     res.json({ success: true, product });
//     } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Handle new images
    let imagesArray = product.images;

    if (req.files && req.files.length > 0) {
      // delete old cloudinary files
      for (const img of product.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      imagesArray = [];

      for (const file of req.files) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        imagesArray.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images: imagesArray },
      { new: true }
    );

    res.json({
      success: true,
      message: "Product updated",
      product,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    // delete cloudinary images
    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
