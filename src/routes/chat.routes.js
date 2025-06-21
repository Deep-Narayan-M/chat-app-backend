import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import getChatToken from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getChatToken);

export default router;
