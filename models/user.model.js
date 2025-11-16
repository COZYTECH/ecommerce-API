import mongoose from "mongoose";

export const userDataSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        return this.role !== "superadmin";
      },
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
      // required: function () {
      //   return this.role !== "superadmin" && this.role !== "admin";
      // },
      // required: function () {
      //   const role = this.role ? this.role.toLowerCase() : "user";
      //   const optionalRoles = ["superadmin", "admin"];
      //   return !optionalRoles.includes(role);
      // },

      required: function () {
        // Only required on new documents
        if (!this.isNew) return false;

        const role = this.role ? this.role.toLowerCase() : "user";
        const optionalRoles = ["superadmin", "admin"];
        return !optionalRoles.includes(role);
      },
      trim: true,
      min: 10,
      max: 100,
    },
    refreshToken: { type: String },
    role: {
      type: String,
      enum: ["user", "superadmin", "admin"],
      default: "user",
      required: true,
    },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userDataSchema);
export default User;
