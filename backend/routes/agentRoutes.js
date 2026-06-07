const express = require("express");
const router = express.Router();

const {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  updateAgentStatus,
  getAgentsByAgency,
} = require("../controllers/agentController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", getAgents);
router.get("/:id", getAgent);

router.use(verifyToken);

router.post("/", createAgent);
router.put("/:id", updateAgent);
router.patch("/:id/status", updateAgentStatus);

module.exports = router;

module.exports.getAgentsByAgency = getAgentsByAgency;
