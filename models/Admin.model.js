import mongoose from "mongoose";

export const adminDataSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      min: 3,
      max: 30,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      min: 5,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    refreshToken: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "admin" },
  },
  { timestamps: true }
);
const Admin = mongoose.model("Admin", adminDataSchema);
export default Admin;
