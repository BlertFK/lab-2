const { AppError } = require("../utils/errors.util");
const logger = require("../config/logger");
const env = require("../config/env");

function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.originalUrl} not found.` },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(err.stack || err.message);
    else logger.warn(`${err.code}: ${err.message}`);
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err.isJoi) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.details.map((d) => ({ field: d.path.join("."), message: d.message })),
      },
    });
  }

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Duplicate value violates a unique constraint." },
    });
  }

  logger.error(err.stack || err.message);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: env.isProd ? "An unexpected error occurred." : err.message,
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
