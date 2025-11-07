import express from "express";
import {
    getCashierOrderDetails,
    getCashierSalesReport,
    getDashboardReport,
    getLowStockAlerts,
    getRefundedOrders,
    getSalesSummary,
    getSalesTrend,
    getTipsSummary,
    getTopSellingProducts,
    getVoidedOrders, getCashierTodaySales, getEarningsReport, exportSalesReport
} from "../controllers/report.controller.js";

const router = express.Router();

router.get("/sales-summary", getSalesSummary);
router.get("/top-products", getTopSellingProducts);
router.get("/low-stock", getLowStockAlerts);
router.get("/dashboard", getDashboardReport);
router.get("/earnings", getEarningsReport);

router.get("/tips-summary", getTipsSummary);

router.get("/cashier-sales", getCashierSalesReport);
router.get("/cashier-orders/:cashierId", getCashierOrderDetails);

router.get("/voided-orders", getVoidedOrders);
router.get("/refunded-orders", getRefundedOrders);

router.get("/sales-trend", getSalesTrend);

router.get("/cashier-today-sales", getCashierTodaySales);
router.get("/export", exportSalesReport);


export default router;