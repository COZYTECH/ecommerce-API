import mongoose from "mongoose";

export const userDataSchema = new mongoose.Schema(
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
    address: {
      type: String,
      required: true,
      trim: true,
      min: 10,
      max: 100,
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userDataSchema);
export default User;
