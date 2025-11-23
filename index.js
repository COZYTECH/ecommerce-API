import express from "express";
import { ENV } from "./config/env.config.js";
import connectDB from "./config/db.config.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.route.js";
import productRoutes from "./routes/create.product.route.js";
import cookieParser from "cookie-parser";
import cartRoute from "./routes/cart.route.js";
//import { swaggerDocs } from "./docs/swagger.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

await connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// app.use(cartKeyMiddleware());
app.use(cookieParser());
// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//swaggerDocs(app);
const swaggerDocument = YAML.load(path.join(__dirname, "docs", "openapi.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoute);
//app.use("/api/products", (await import("./routes/create.product.route.js")).default);
app.use("/api/products", productRoutes);
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(ENV.PORT, () => {
  console.log("Server is running on http://localhost:" + ENV.PORT);
});
