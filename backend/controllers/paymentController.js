const paymentRepository = require("../repositories/paymentRepository");

const getStripe = () => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return null;
  try {
    return require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
  } catch {
    return null;
  }
};

const getProviderPaymentId = (event) => {
  const object = event?.data?.object || {};

  if (object.object === "payment_intent") return object.id;
  if (object.object === "charge") return object.payment_intent || object.id;
  if (object.object === "refund") return object.payment_intent || object.charge || object.id;
  if (object.object === "checkout.session") return object.payment_intent || object.id;

  return object.payment_intent || object.id || null;
};

const getPaymentStatusFromEvent = (event) => {
  if (!event?.type) return null;

  if (event.type === "payment_intent.succeeded") return "succeeded";
  if (event.type === "checkout.session.completed") return "succeeded";
  if (event.type === "payment_intent.payment_failed") return "failed";
  if (event.type === "charge.failed") return "failed";
  if (event.type === "charge.refunded") return "refunded";
  if (event.type === "refund.created" || event.type === "refund.updated") return "refunded";

  return null;
};

const parseWebhookEvent = (req) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !stripe) {
    const error = new Error("Stripe webhook is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    const error = new Error("Missing Stripe signature.");
    error.statusCode = 400;
    throw error;
  }

  try {
    return stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    const signatureError = new Error(`Invalid Stripe signature: ${error.message}`);
    signatureError.statusCode = 400;
    throw signatureError;
  }
};

const handleStripeWebhook = async (req, res) => {
  try {
    const event = parseWebhookEvent(req);
    const status = getPaymentStatusFromEvent(event);

    if (!status) {
      return res.status(200).json({
        received: true,
        ignored: true,
        event: event.type,
      });
    }

    const providerPaymentId = getProviderPaymentId(event);
    const result = await paymentRepository.updateStatusByProviderPaymentId(providerPaymentId, status);

    return res.status(200).json({
      received: true,
      event: event.type,
      providerPaymentId,
      requestedStatus: status,
      status: result.status,
      updated: result.affectedRows > 0,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Server error. Please try again.",
    });
  }
};

module.exports = {
  handleStripeWebhook,
};
