const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const notificationCtrl = require("../controllers/notification.controller");

router.use(authenticate);

router.get("/",            notificationCtrl.list);
router.patch("/read-all",  notificationCtrl.markAllRead);
router.patch("/:id/read",  notificationCtrl.markRead);

module.exports = router;
