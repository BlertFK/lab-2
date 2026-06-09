const Joi = require("joi");

// Accept any TLD (default Joi only allows IANA-listed TLDs, which rejects
// .local / .test used in dev seeds like admin@realestate.local).
const email = Joi.string()
  .email({ tlds: { allow: false }, minDomainSegments: 2 })
  .lowercase();

const password = Joi.string().min(8).max(128).required();

const register = Joi.object({
  first_name: Joi.string().trim().min(1).max(60).required(),
  last_name: Joi.string().trim().min(1).max(60).required(),
  email: email.required(),
  password,
  phone: Joi.string().trim().max(30).allow("", null),
  // Self-register may pick Buyer (default) or Seller; everything else is
  // silently coerced to Buyer in the service.
  role: Joi.string().valid("Buyer", "Seller", "buyer", "seller").default("Buyer"),
});

const login = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

const logout = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password,
});

const forgotPassword = Joi.object({
  email: email.required(),
});

module.exports = { register, login, refresh, logout, changePassword, forgotPassword };
