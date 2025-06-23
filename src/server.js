import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();
dotenv.config();

const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-XSRF-TOKEN"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Security for cookies
app.use(cookieParser());
app.use((req, res, next) => {
  res.cookie("token", req.cookies.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
    domain: process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
  });
  next();
});

// Increase payload size limit to 5MB
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof SyntaxError && err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request entity too large. Please upload a smaller file.",
    });
  }
  res.status(500).json({
    success: false,
    message: "Something went wrong! Please try again later.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
  connectDB();
});
