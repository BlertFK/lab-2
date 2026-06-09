const express = require("express");
const router = express.Router();
const { authenticate, optionalAuth } = require("../middleware/auth.middleware");
const searchCtrl = require("../controllers/search.controller");

// Optional auth: anonymous callers get public-only search (properties).
router.get("/", optionalAuth, searchCtrl.search);

module.exports = router;
