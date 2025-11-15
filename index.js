import express from "express";
import { ENV } from "./config/env.config.js";
import connectDB from "./config/db.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.route.js";
import productRoutes from "./routes/create.product.route.js";
await connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
//app.use("/api/products", (await import("./routes/create.product.route.js")).default);
app.use("/api/products", productRoutes);
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(ENV.PORT, () => {
  console.log("Server is running on http://localhost:" + ENV.PORT);
});
