const reportService = require("../services/reportService");
const reportExportService = require("../services/reportExportService");

const handleError = (res, error) => {
  console.error("Report error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const getSalesByPeriod = async (req, res) => {
  try {
    const report = await reportService.runSalesByPeriod(req.query, req.user);
    res.status(200).json({ report });
  } catch (error) {
    handleError(res, error);
  }
};

const respondReport = async (req, res, runner) => {
  try {
    const report = await runner(req.query, req.user);
    res.status(200).json({ report });
  } catch (error) {
    handleError(res, error);
  }
};

const sendExport = async (req, res, report) => {
  const format = req.query.format || "csv";
  const exportedReport = await reportExportService.exportReport(report, format);

  res.setHeader("Content-Type", exportedReport.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${exportedReport.filename}"`);
  res.send(exportedReport.buffer);
};

const exportSalesByPeriod = async (req, res) => {
  try {
    const report = await reportService.runSalesByPeriod(req.query, req.user);
    await sendExport(req, res, report);
  } catch (error) {
    handleError(res, error);
  }
};

const exportReport = async (req, res, runner) => {
  try {
    const report = await runner(req.query, req.user);
    await sendExport(req, res, report);
  } catch (error) {
    handleError(res, error);
  }
};

const getListingsByStatus = async (req, res) => {
  try {
    const report = await reportService.runListingsByStatus(req.query, req.user);
    res.status(200).json({ report });
  } catch (error) {
    handleError(res, error);
  }
};

const exportListingsByStatus = async (req, res) => {
  try {
    const report = await reportService.runListingsByStatus(req.query, req.user);
    await sendExport(req, res, report);
  } catch (error) {
    handleError(res, error);
  }
};

const getTopPropertiesByViews = async (req, res) => {
  try {
    const report = await reportService.runTopPropertiesByViews(req.query, req.user);
    res.status(200).json({ report });
  } catch (error) {
    handleError(res, error);
  }
};

const exportTopPropertiesByViews = async (req, res) => {
  try {
    const report = await reportService.runTopPropertiesByViews(req.query, req.user);
    await sendExport(req, res, report);
  } catch (error) {
    handleError(res, error);
  }
};

const getRevenueByAgent = (req, res) => respondReport(req, res, reportService.runRevenueByAgent);
const exportRevenueByAgent = (req, res) => exportReport(req, res, reportService.runRevenueByAgent);

const getPendingOffersAging = (req, res) => respondReport(req, res, reportService.runPendingOffersAging);
const exportPendingOffersAging = (req, res) => exportReport(req, res, reportService.runPendingOffersAging);

const getActiveSubscriptions = (req, res) => respondReport(req, res, reportService.runActiveSubscriptions);
const exportActiveSubscriptions = (req, res) => exportReport(req, res, reportService.runActiveSubscriptions);

module.exports = {
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
};
