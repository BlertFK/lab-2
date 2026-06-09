const Joi = require("joi");

const create = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(255).allow("", null),
});

const update = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  description: Joi.string().trim().max(255).allow("", null),
}).min(1);

const assignPermission = Joi.object({
  permission_id: Joi.number().integer().positive().required(),
});

module.exports = { create, update, assignPermission };
