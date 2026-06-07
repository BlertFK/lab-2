const express = require("express");
const router = express.Router();

const {
  createAgency,
  getAgencies,
  getAgency,
  updateAgency,
} = require("../controllers/agencyController");
const { getAgentsByAgency } = require("../controllers/agentController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", getAgencies);
router.get("/:agencyId/agents", getAgentsByAgency);
router.get("/:id", getAgency);

router.use(verifyToken);

router.post("/", createAgency);
router.put("/:id", updateAgency);

module.exports = router;
