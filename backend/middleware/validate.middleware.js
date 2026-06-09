function validate(schema, source = "body") {
  return (req, res, next) => {
    // express only populates req.body when a Content-Type is sent. Treat a
    // missing body as {} so required fields surface as proper 422 errors
    // instead of TypeError in the controller.
    const input = req[source] == null ? {} : req[source];
    const { value, error } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return next(error);
    }
    req[source] = value;
    next();
  };
}

module.exports = validate;
