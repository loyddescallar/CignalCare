const express = require("express");
const router = express.Router();

const {
  addLoad,
  getMyLoadHistory,
  getAllLoadHistoryController
} = require("../controllers/loadController");

const { authRequired, requireRole } = require("../middleware/auth");

// User routes
router.post("/", authRequired, addLoad);
router.get("/my", authRequired, getMyLoadHistory);

// Admin
router.get("/admin", authRequired, requireRole("admin"), getAllLoadHistoryController);

module.exports = router;
