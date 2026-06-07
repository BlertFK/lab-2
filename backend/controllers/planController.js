const planService = require("../services/planService");

const handleError = (res, error) => {
  console.error("Plan error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const getPlans = async (req, res) => {
  try {
    const plans = await planService.listPlans();
    res.status(200).json({ plans });
  } catch (error) {
    handleError(res, error);
  }
};

const getMySubscription = async (req, res) => {
  try {
    const subscription = await planService.getCurrentSubscription(req.user);
    res.status(200).json({ subscription });
  } catch (error) {
    handleError(res, error);
  }
};

const subscribe = async (req, res) => {
  try {
    const subscription = await planService.subscribeToPlan(req.body, req.user);
    res.status(200).json({ message: "Subscription updated.", subscription });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getPlans,
  getMySubscription,
  subscribe,
};
