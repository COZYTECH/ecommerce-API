import { ENV } from "./env.config.js";
import connectDB from "./db.config.js";
import User from "../models/user.model.js";
import doHash from "../lib/hash.js";

const createSuperAdmin = async () => {
  await connectDB();

  const exists = await User.findOne({ role: "superadmin" });
  if (exists) {
    console.log("Superadmin already exists");
    return process.exit(0);
  }
  const password = ENV.SUPERADMIN_PASSWORD;
  const hashedPassword = await doHash(password, 10);

  await User.create({
    email: ENV.SUPERADMIN_EMAIL,
    password: hashedPassword,
    role: "superadmin",
  });

  console.log("Superadmin created successfully");
  process.exit(1);
};

createSuperAdmin();
