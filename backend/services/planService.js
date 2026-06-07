const planRepository = require("../repositories/planRepository");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 30));
  return date;
};

const listPlans = () => planRepository.listActivePlans();

const getCurrentSubscription = async (user) => {
  const subscription = await planRepository.findSubscriptionByUserId(user.id);
  if (subscription) return subscription;

  const freePlan = await planRepository.findPlanBySlug("free");
  if (!freePlan) {
    throw createError("Free plan is not configured.", 500);
  }

  return {
    id: null,
    user_id: user.id,
    plan_id: freePlan.id,
    plan_name: freePlan.name,
    plan_slug: freePlan.slug,
    max_listings: freePlan.max_listings,
    max_featured: freePlan.max_featured,
    price: freePlan.price,
    status: "active",
    expires_at: null,
  };
};

const subscribeToPlan = async (body, user) => {
  const planId = Number(body.plan_id);
  const plan = planId
    ? await planRepository.findPlanById(planId)
    : await planRepository.findPlanBySlug(body.slug || "free");

  if (!plan || !plan.is_active) {
    throw createError("Plan not found.");
  }

  return planRepository.upsertSubscription({
    user_id: user.id,
    plan_id: plan.id,
    expires_at: addDays(plan.duration_days),
    auto_renew: Boolean(body.auto_renew),
  });
};

const assertCanCreateListing = async (user) => {
  const subscription = await getCurrentSubscription(user);
  const listingCount = await planRepository.countListingsForUser(user.id);
  const maxListings = Number(subscription.max_listings || 10);

  if (listingCount >= maxListings) {
    throw createError(
      `Listing quota reached. Your ${subscription.plan_name || "Free"} plan allows ${maxListings} listings.`,
      403
    );
  }

  return { subscription, listingCount, maxListings };
};

module.exports = {
  listPlans,
  getCurrentSubscription,
  subscribeToPlan,
  assertCanCreateListing,
};
