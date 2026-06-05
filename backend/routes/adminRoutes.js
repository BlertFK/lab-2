const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Të gjitha routes kërkojnë admin token
router.use(verifyToken, requireRole("admin"));

// Users
router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);
router.put("/users/:id", adminController.updateUser);

// Properties
router.get("/properties", adminController.getAllProperties);
router.put("/properties/:id", adminController.updateProperty);
router.delete("/properties/:id", adminController.deleteProperty);

module.exports = router;
