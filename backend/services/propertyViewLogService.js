const { isMongoAvailable } = require("../config/mongo");
const PropertyViewLog = require("../models/mongo/PropertyViewLog");

const createPropertyViewLog = async ({
  property_id,
  user_id = null,
  ip_address = null,
  user_agent = null,
  source = "property_detail",
}) => {
  if (!isMongoAvailable()) return null;

  try {
    return await PropertyViewLog.create({
      property_id: Number(property_id),
      user_id: user_id ? Number(user_id) : null,
      ip_address,
      user_agent,
      source,
      viewed_at: new Date(),
    });
  } catch (error) {
    console.error("PropertyViewLog write failed:", error.message);
    return null;
  }
};

module.exports = {
  createPropertyViewLog,
};
