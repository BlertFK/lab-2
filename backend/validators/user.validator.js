const Joi = require("joi");

const update = Joi.object({
  first_name: Joi.string().trim().min(1).max(60),
  last_name: Joi.string().trim().min(1).max(60),
  phone: Joi.string().trim().max(30).allow("", null),
  avatar_file_id: Joi.number().integer().positive().allow(null),
}).min(1);

const status = Joi.object({
  is_active: Joi.boolean().required(),
});

const assignRole = Joi.object({
  role_id: Joi.number().integer().positive().required(),
});

module.exports = { update, status, assignRole };
