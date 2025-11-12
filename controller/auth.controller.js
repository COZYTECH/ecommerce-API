import { registerSchema } from "../middleware/schema.validation.js";
import User from "../models/user.model.js";
import doHash from "../lib/hash.js";

export const register = async (req, res) => {
  // Registration logic here

  const { username, email, password, address, repeatPassword } = req.body;
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }
    // hashing the user password
    const hashedPassword = await doHash(password, 10); // Replace with actual hashing logic
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      address,
    });
    const result = await newUser.save();
    result.password = undefined;
    res
      .status(201)
      .json({ success: true, message: "user created successfully", result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
  res.send("User registered successfully");
};
