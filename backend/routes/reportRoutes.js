const express = require("express");
const router = express.Router();

const {
  getSalesByPeriod,
  exportSalesByPeriod,
  getListingsByStatus,
  exportListingsByStatus,
  getTopPropertiesByViews,
  exportTopPropertiesByViews,
  getRevenueByAgent,
  exportRevenueByAgent,
  getPendingOffersAging,
  exportPendingOffersAging,
  getActiveSubscriptions,
  exportActiveSubscriptions,
} = require("../controllers/reportController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/sales", getSalesByPeriod);
router.get("/sales/export", exportSalesByPeriod);
router.get("/listings", getListingsByStatus);
router.get("/listings/export", exportListingsByStatus);
router.get("/top-properties", getTopPropertiesByViews);
router.get("/top-properties/export", exportTopPropertiesByViews);
router.get("/revenue-by-agent", getRevenueByAgent);
router.get("/revenue-by-agent/export", exportRevenueByAgent);
router.get("/pending-offers-aging", getPendingOffersAging);
router.get("/pending-offers-aging/export", exportPendingOffersAging);
router.get("/active-subscriptions", getActiveSubscriptions);
router.get("/active-subscriptions/export", exportActiveSubscriptions);

module.exports = router;
