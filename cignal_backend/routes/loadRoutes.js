const express = require("express");
const router = express.Router();
const {
  addLoad,
  getMyLoadHistory,
  getAllLoadHistoryController,
  getPlansController,
  updateLoadStatus
} = require("../controllers/loadController");
const { authRequired, requireRole } = require("../middleware/auth");

// Get all prepaid plans (admin + user)
router.get("/plans", authRequired, getPlansController);

// User routes
router.post("/", authRequired, addLoad);
router.get("/my", authRequired, getMyLoadHistory);

// Admin routes
router.get("/admin", authRequired, requireRole("admin"), getAllLoadHistoryController);
router.patch("/admin/:id", authRequired, requireRole("admin"), updateLoadStatus);

module.exports = router;
