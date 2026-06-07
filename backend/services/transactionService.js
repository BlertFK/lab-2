const transactionRepository = require("../repositories/transactionRepository");

const allowedTransitions = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

const assertCanSeeTransaction = (transaction, user) => {
  if (user.role === "admin") return;
  if (user.role === "buyer" && transaction.buyer_id === user.id) return;
  if (user.role === "seller" && transaction.seller_id === user.id) return;

  const error = new Error("You do not have access to this transaction.");
  error.statusCode = 403;
  throw error;
};

const listTransactions = (user) => transactionRepository.listForUser(user);

const getTransaction = async (id, user) => {
  const transaction = await transactionRepository.findById(id);
  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  assertCanSeeTransaction(transaction, user);
  return transaction;
};

const updateTransactionStatus = async (id, body, user) => {
  const transaction = await getTransaction(id, user);

  if (user.role !== "seller" && user.role !== "admin") {
    const error = new Error("Only sellers or admins can update transaction state.");
    error.statusCode = 403;
    throw error;
  }

  const nextStatuses = allowedTransitions[transaction.status] || [];
  if (!nextStatuses.includes(body.status)) {
    const error = new Error(`Transaction cannot move from ${transaction.status} to ${body.status}.`);
    error.statusCode = 400;
    throw error;
  }

  await transactionRepository.updateStatus(id, {
    status: body.status,
    payment_method: body.payment_method,
    completed_at: body.status === "completed" ? new Date() : null,
    updated_by: user.id,
  });

  return transactionRepository.findById(id);
};

module.exports = {
  listTransactions,
  getTransaction,
  updateTransactionStatus,
};

