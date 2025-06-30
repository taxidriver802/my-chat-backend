import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/auth.controller.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/logout", protectRoute, logout);
router.put("/update-profile", protectRoute, updateProfile);

router.post("/block/:userId", protectRoute, blockUser);
router.post("/unblock/:userId", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

router.get("/check", protectRoute, checkAuth);

export default router;
