const Joi = require("joi");

const upsert = Joi.object({
  value: Joi.alternatives()
    .try(Joi.string().allow(""), Joi.number(), Joi.boolean(), Joi.object(), Joi.array(), Joi.valid(null))
    .required(),
  type: Joi.string().valid("string", "number", "boolean", "json"),
  description: Joi.string().trim().max(255).allow("", null),
  is_public: Joi.boolean(),
});

module.exports = { upsert };
