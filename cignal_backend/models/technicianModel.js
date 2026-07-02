const pool = require("../config/db");

async function createRequest(reqData) {
  const sql = `INSERT INTO technician_requests
    (user_id, accountNumber, contactName, contactPhone, issueDescription, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')`;
  const [result] = await pool.query(sql, [
    reqData.user_id,
    reqData.accountNumber,
    reqData.contactName,
    reqData.contactPhone,
    reqData.issueDescription
  ]);
  return result.insertId;
}

async function getRequestsByUser(userId) {
  const [rows] = await pool.query(
    "SELECT * FROM technician_requests WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
  return rows;
}

async function getAllRequests() {
  const [rows] = await pool.query(
    `SELECT tr.*, u.accountName
     FROM technician_requests tr
     LEFT JOIN users u ON u.id = tr.user_id
     ORDER BY tr.created_at DESC`
  );
  return rows;
}

async function updateRequestStatus(id, status) {
  await pool.query(
    "UPDATE technician_requests SET status = ?, updated_at = NOW() WHERE id = ?",
    [status, id]
  );
}

module.exports = {
  createRequest,
  getRequestsByUser,
  getAllRequests,
  updateRequestStatus
};
