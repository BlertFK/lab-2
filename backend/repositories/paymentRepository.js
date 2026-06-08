const db = require("../config/db");

let cachedStatusValues = null;

const hasPaymentsTable = async () => {
  const [rows] = await db.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments'`
  );

  return rows.length > 0;
};

const getPaymentStatusValues = async () => {
  if (cachedStatusValues) return cachedStatusValues;

  const [rows] = await db.query(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'payments'
       AND COLUMN_NAME = 'status'`
  );

  const columnType = rows[0]?.COLUMN_TYPE || "";
  cachedStatusValues = columnType
    .replace(/^enum\(/i, "")
    .replace(/\)$/i, "")
    .split(",")
    .map((value) => value.trim().replace(/^'|'$/g, ""))
    .filter(Boolean);

  return cachedStatusValues;
};

const normalizeStatus = async (status) => {
  const values = await getPaymentStatusValues();
  if (values.includes(status)) return status;
  if (status === "succeeded" && values.includes("paid")) return "paid";
  return values.includes("failed") ? "failed" : status;
};

const updateStatusByProviderPaymentId = async (providerPaymentId, status) => {
  if (!providerPaymentId || !(await hasPaymentsTable())) {
    return { affectedRows: 0, status: null };
  }

  const normalizedStatus = await normalizeStatus(status);
  const paidAtExpression = normalizedStatus === "paid" || normalizedStatus === "succeeded"
    ? "NOW()"
    : "paid_at";

  const [result] = await db.query(
    `UPDATE payments
     SET status = ?, paid_at = ${paidAtExpression}
     WHERE provider = 'stripe' AND provider_payment_id = ?`,
    [normalizedStatus, providerPaymentId]
  );

  return {
    affectedRows: result.affectedRows,
    status: normalizedStatus,
  };
};

module.exports = {
  hasPaymentsTable,
  getPaymentStatusValues,
  updateStatusByProviderPaymentId,
};
