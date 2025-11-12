import mongoose from "mongoose";
import { ENV } from "./env.config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB connected successfully", connectDB.name);
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
