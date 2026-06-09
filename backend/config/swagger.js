const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: `${env.appName} API`,
      version: "1.0.0",
      description:
        "RealEstate platform REST API. Bearer auth via JWT access token. " +
        "Refresh token rotation is handled by /api/auth/refresh.",
    },
    servers: [
      { url: `http://localhost:${env.port}`, description: "Local" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            pageSize: { type: "integer", example: 20 },
            total: { type: "integer", example: 124 },
            totalPages: { type: "integer", example: 7 },
            hasNext: { type: "boolean" },
            hasPrev: { type: "boolean" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            is_active: { type: "boolean" },
            roles: { type: "array", items: { type: "string" } },
            permissions: { type: "array", items: { type: "string" } },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    "./controllers/*.js",
    "./controllers/**/*.js",
    "./routes/*.js",
  ],
};

const spec = swaggerJsdoc(options);

module.exports = { spec, options };
