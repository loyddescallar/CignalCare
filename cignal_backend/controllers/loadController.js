const {
  addLoadHistory,
  getLoadHistoryByUser,
  getAllLoadHistory
} = require("../models/loadModel");

/**
 * CREATE LOAD REQUEST (NOT DIRECT LOAD ANYMORE)
 * This now follows FIGMA workflow: User → Admin Approval → Execution
 */
async function addLoad(req, res) {
  try {
    const { accountNumber, loadAmount, description } = req.body;

    if (!accountNumber || !loadAmount) {
      return res.status(400).json({
        error: "accountNumber and loadAmount are required"
      });
    }

    // CREATE LOAD REQUEST (PENDING STATUS)
    const id = await addLoadHistory({
      user_id: req.user.id,
      accountNumber,
      loadAmount,
      description,
      status: "pending" // IMPORTANT: FIGMA FLOW REQUIREMENT
    });

    return res.status(201).json({
      message: "Load request submitted successfully and is pending admin approval",
      requestId: id,
      status: "pending"
    });

  } catch (err) {
    console.error("ADD LOAD REQUEST ERROR", err);
    return res.status(500).json({
      error: "Server error creating load request"
    });
  }
}

/**
 * GET LOGGED-IN USER LOAD REQUEST HISTORY
 */
async function getMyLoadHistory(req, res) {
  try {
    const history = await getLoadHistoryByUser(req.user.id);

    return res.json({
      success: true,
      history
    });

  } catch (err) {
    console.error("GET MY LOAD HISTORY ERROR", err);
    return res.status(500).json({
      error: "Server error fetching load history"
    });
  }
}

/**
 * ADMIN: GET ALL LOAD REQUESTS
 */
async function getAllLoadHistoryController(req, res) {
  try {
    const history = await getAllLoadHistory();

    return res.json({
      success: true,
      history
    });

  } catch (err) {
    console.error("GET ALL LOAD HISTORY ERROR", err);
    return res.status(500).json({
      error: "Server error fetching load history"
    });
  }
}

/**
 * (OPTIONAL BUT IMPORTANT FOR FIGMA FLOW)
 * UPDATE LOAD STATUS (ADMIN ACTION)
 */
async function updateLoadStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Status is required"
      });
    }

    // Update status in DB
    await require("../models/loadModel").updateLoadStatus(id, status);

    return res.json({
      success: true,
      message: `Load request ${status}`
    });

  } catch (err) {
    console.error("UPDATE LOAD STATUS ERROR", err);
    return res.status(500).json({
      error: "Server error updating load status"
    });
  }
}

/**
 * EXPORT CONTROLLERS
 */
module.exports = {
  addLoad,
  getMyLoadHistory,
  getAllLoadHistoryController,
  updateLoadStatus // IMPORTANT FOR ADMIN FIGMA FLOW
};