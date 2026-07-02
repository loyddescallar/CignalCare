const pool = require("../config/db");

async function findByAccountName(accountName) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE BINARY accountName = ? LIMIT 1",
    [accountName]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function checkDuplicate(accountNumber, ccaNumber, excludeId = null) {
  let sql = "SELECT id FROM users WHERE (accountNumber = ? OR ccaNumber = ? )";
  const params = [accountNumber, ccaNumber];

  if (excludeId) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

async function createUser(user) {
  const sql = `
    INSERT INTO users (accountName, accountNumber, ccaNumber, address, phone, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    user.accountName,
    user.accountNumber,
    user.ccaNumber,
    user.address,
    user.phone,
    user.role || "user",
  ]);
  return result.insertId;
}

async function findByAccountIdOrCca(accountId) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE accountNumber = ? OR ccaNumber = ? LIMIT 1",
    [accountId, accountId]
  );
  return rows[0] || null;
}

async function getAllUsers() {
  const [rows] = await pool.query(
    `SELECT id, accountName, accountNumber, ccaNumber, address, phone, role, created_at
     FROM users
     ORDER BY created_at DESC, id DESC`
  );
  return rows;
}

async function updateUser(id, data) {
  const sql = `
    UPDATE users
    SET accountName = ?, accountNumber = ?, ccaNumber = ?, address = ?, phone = ?, role = ?
    WHERE id = ?
  `;
  await pool.query(sql, [
    data.accountName,
    data.accountNumber,
    data.ccaNumber,
    data.address,
    data.phone,
    data.role || "user",
    id,
  ]);
}

async function deleteUser(id) {
  await pool.query("DELETE FROM users WHERE id = ?", [id]);
}

module.exports = {
  findByAccountName,
  findById,
  checkDuplicate,
  createUser,
  findByAccountIdOrCca,
  getAllUsers,
  updateUser,
  deleteUser,
};
