// routes/customerRoutes.js
const express = require("express");
const router = express.Router();

const {
  getCustomerByAccount,
  listCustomers,
  createCustomerController,
  updateCustomerController,
  deleteCustomerController,
} = require("../controllers/customerController");

const { authRequired, requireRole } = require("../middleware/auth");

// 🔐 Admin routes: list + create + edit + delete
router.get(
  "/",
  authRequired,
  requireRole("admin"),
  listCustomers
);

router.post(
  "/",
  authRequired,
  requireRole("admin"),
  createCustomerController
);

router.put(
  "/id/:id",
  authRequired,
  requireRole("admin"),
  updateCustomerController
);

router.delete(
  "/id/:id",
  authRequired,
  requireRole("admin"),
  deleteCustomerController
);

// 🔎 Lookup by accountNumber or ccaNumber (for any logged-in user)
// Example: GET /api/customers/88773322
router.get(
  "/:accountId",
  authRequired,
  getCustomerByAccount
);

module.exports = router;
