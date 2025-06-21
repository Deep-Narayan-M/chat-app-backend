import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { upsertStreamUser } from "../lib/stream.js";

export const signup = async (req, res) => {
  const { username, email, password, gender } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 5) {
      return res
        .status(400)
        .json({ message: "Password must be at least 5 characters long" });
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const idx = Math.floor(Math.random() * 99) + 1;
    const randomAvatar = `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;

    const newUser = await User.create({
      username,
      email,
      password,
      gender,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.username,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user upserted for user ${newUser.username}`);
    } catch (error) {
      console.error("Error upserting stream user", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("token", token, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      success: true,
      user: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid Credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("token", token, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(200)
      .json({ success: true, user: user, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logout successful" });
};

export const onboarding = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, gender, bio, location } = req.body;

    if (!username || !gender || !bio || !location) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields: [
          !username && "username",
          !gender && "gender",
          !bio && "bio",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.username,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user upserted for user ${updatedUser.username}`);
    } catch (error) {
      console.error("Error upserting stream user", error);
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Onboarding successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
