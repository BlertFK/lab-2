const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const schemas = require("../validators/auth.validator");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/register", validate(schemas.register), auth.register);
router.post("/login", validate(schemas.login), auth.login);
router.post("/refresh", validate(schemas.refresh), auth.refresh);
router.post("/forgot-password", validate(schemas.forgotPassword), auth.forgotPassword);

router.post("/logout", validate(schemas.logout), auth.logout);
router.post("/logout-all", authenticate, auth.logoutAll);
router.get("/me", authenticate, auth.me);
router.post("/change-password", authenticate, validate(schemas.changePassword), auth.changePassword);

module.exports = router;
