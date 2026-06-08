const express = require("express");
const { handleStripeWebhook } = require("../controllers/paymentController");

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;
