import express from "express";
import { ENV } from "./config/env.config.js";
import connectDB from "./config/db.config.js";
import authRoutes from "./routes/auth.routes.js";

await connectDB();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(ENV.PORT, () => {
  console.log("Server is running on http://localhost:" + ENV.PORT);
});
