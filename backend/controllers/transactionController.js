const transactionService = require("../services/transactionService");
const { validateTransactionStatus } = require("../validators/transactionValidator");

const handleError = (res, error) => {
  console.error("Transaction error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await transactionService.listTransactions(req.user);
    res.status(200).json({ transactions });
  } catch (error) {
    handleError(res, error);
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transaction = await transactionService.getTransaction(req.params.id, req.user);
    res.status(200).json({ transaction });
  } catch (error) {
    handleError(res, error);
  }
};

const updateTransactionStatus = async (req, res) => {
  const errors = validateTransactionStatus(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const transaction = await transactionService.updateTransactionStatus(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Transaction status updated.", transaction });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
};

