import Order from "../models/Order.js";
import Product from "../models/Product.js";
import RawMaterial from "../models/RawMaterial.js";
import ExcelJS from "exceljs";

const LOW_STOCK_THRESHOLDS = {
  kilograms: 2,
  grams: 100,
  liters: 1,
  milliliters: 200,
  pounds: 1,
  ounces: 10,
  pieces: 5,
  packs: 3,
  bags: 2,
  boxes: 2,
  cans: 5,
};


export const getSalesSummary = async (req, res) => {
  try {
    const { range } = req.query;
    const now = new Date();
    let currentStartDate, previousStartDate;

    if (range === "weekly") {
      currentStartDate = new Date(now);
      currentStartDate.setDate(currentStartDate.getDate() - 7);
      previousStartDate = new Date(now);
      previousStartDate.setDate(previousStartDate.getDate() - 14);
    } else if (range === "monthly") {
      currentStartDate = new Date(now);
      currentStartDate.setMonth(currentStartDate.getMonth() - 1);
      previousStartDate = new Date(now);
      previousStartDate.setMonth(previousStartDate.getMonth() - 2);
    } else {
      currentStartDate = new Date(now);
      currentStartDate.setDate(currentStartDate.getDate() - 1);
      previousStartDate = new Date(now);
      previousStartDate.setDate(previousStartDate.getDate() - 2);
    }

    const currentOrders = await Order.find({ createdAt: { $gte: currentStartDate } });
    const currentTotalSales = currentOrders.reduce((sum, o) => sum + o.total, 0);
    const currentTotalOrders = currentOrders.length;
    const currentTotalItems = currentOrders.reduce((sum, o) => {
      return sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0);
    }, 0);

    const previousOrders = await Order.find({
      createdAt: { $gte: previousStartDate, $lt: currentStartDate },
    });
    const previousTotalSales = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const previousTotalOrders = previousOrders.length;
    const previousTotalItems = previousOrders.reduce((sum, o) => {
      return sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0);
    }, 0);

    const salesChange = previousTotalSales === 0
      ? (currentTotalSales === 0 ? 0 : 100)
      : ((currentTotalSales - previousTotalSales) / previousTotalSales) * 100;

    const ordersChange = previousTotalOrders === 0
      ? (currentTotalOrders === 0 ? 0 : 100)
      : ((currentTotalOrders - previousTotalOrders) / previousTotalOrders) * 100;

    const itemsChange = previousTotalItems === 0
      ? (currentTotalItems === 0 ? 0 : 100)
      : ((currentTotalItems - previousTotalItems) / previousTotalItems) * 100;

      console.log("🧾 Sales Summary Debug:", {
      currentTotalSales,
      previousTotalSales,
      salesChange,
      currentTotalOrders,
      previousTotalOrders,
      ordersChange,
      currentTotalItems,
      previousTotalItems,
      itemsChange
    });


    res.json({
      totalSales: currentTotalSales,
      totalOrders: currentTotalOrders,
      totalItems: currentTotalItems,
      salesChange,
      ordersChange,
      itemsChange,
      previousSales: previousTotalSales,
      previousOrders: previousTotalOrders,
      previousItems: previousTotalItems,
    });
  } catch (err) {
    console.error("❌ Report error:", err);
    res.status(500).json({ message: "Failed to fetch sales summary" });
  }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([

      { $match: { isVoided: { $ne: true } } },

      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.product",
          totalQuantitySold: { $sum: "$items.quantity" },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },

      {
        $project: {
          _id: 0,
          productId: "$productInfo._id",
          name: "$productInfo.name",
          totalQuantitySold: 1,
        },
      },

      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 },
    ]);

    res.json(topProducts);
  } catch (err) {
    console.error("❌ Top-selling products error:", err);
    res.status(500).json({ message: "Failed to fetch top-selling products" });
  }
};

export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ quantity: { $lte: 5 } })
      .select("name quantity");

    const allMaterials = await RawMaterial.find().select("name quantity unit");

    const lowStockMaterials = allMaterials.filter(m => {
      const threshold = LOW_STOCK_THRESHOLDS[m.unit] || 5;
      return m.quantity < threshold;
    });

    res.json({
      products: lowStockProducts,
      rawMaterials: lowStockMaterials,
    });
  } catch (err) {
    console.error("❌ Low stock fetch error:", err);
    res.status(500).json({ message: "Failed to fetch low stock alerts" });
  }
};

export const getDashboardReport = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantitySold: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          productId: "$productInfo._id",
          name: "$productInfo.name",
          totalQuantitySold: 1,
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 },
    ]);

    const lowStockProducts = await Product.find({ quantity: { $lte: 5 } })
      .select("name quantity");

    const allMaterials = await RawMaterial.find().select("name quantity unit");
    const lowStockMaterials = allMaterials.filter(m => {
      const threshold = LOW_STOCK_THRESHOLDS[m.unit] || 5;
      return m.quantity < threshold;
    });

    res.json({
      topProducts,
      lowStock: {
        products: lowStockProducts,
        rawMaterials: lowStockMaterials,
      },
    });
  } catch (err) {
    console.error("❌ Dashboard report error:", err);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
};

export const getCashierSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const report = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$cashier",
          totalSales: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "cashierInfo",
        },
      },
      { $unwind: "$cashierInfo" },
      {
        $project: {
          cashierId: "$cashierInfo._id",
          cashierName: "$cashierInfo.name",        // ✅ include name field
          cashierEmail: "$cashierInfo.email",
          totalSales: 1,
          orderCount: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json(report);
  } catch (err) {
    console.error("❌ Cashier Sales Report Error:", err);
    res.status(500).json({ message: "Failed to generate cashier sales report" });
  }
};

export const getCashierOrderDetails = async (req, res) => {
  try {
    const { cashierId } = req.params;

    const orders = await Order.find({ cashier: cashierId })
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Cashier Order Details Error:", err);
    res.status(500).json({ message: "Failed to fetch cashier order details" });
  }
};

export const getVoidedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isVoided: true })
      .populate("cashier", "email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Voided orders fetch error:", err);
    res.status(500).json({ message: "Failed to fetch voided orders" });
  }
};

export const getRefundedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isRefunded: true })
      .populate("cashier", "email")
      .sort({ refundDate: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Refunded orders fetch error:", err);
    res.status(500).json({ message: "Failed to fetch refunded orders" });
  }
};

export const getSalesTrend = async (req, res) => {
  try {
    const { range } = req.query;
    const now = new Date();
    let startDate;

    if (range === "weekly") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "monthly") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
    }

    const trendData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isVoided: { $ne: true } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Manila", // ✅ ensures correct local day
              },
            },
          },
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalItems: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.quantity"] },
              },
            },
          },
        },
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: { $substr: ["$_id.date", 5, 5] }, // e.g. "11-05"
          sales: "$totalSales",
          orders: "$totalOrders",
          items: "$totalItems",
        },
      },
    ]);

    res.json(trendData);
  } catch (err) {
    console.error("❌ Sales trend error:", err);
    res.status(500).json({ message: "Failed to fetch sales trend" });
  }
};


export const getTipsSummary = async (req, res) => {
  try {
    const { start, end } = req.query;

    const filter = {};
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    const tipsData = await Order.aggregate([
      { $match: filter },
      { $group: { _id: null, totalTips: { $sum: "$tip" } } },
    ]);

    res.json({ totalTips: tipsData[0]?.totalTips || 0 });
  } catch (error) {
    console.error("❌ Failed to fetch tip summary:", error);
    res.status(500).json({ message: "Failed to fetch tip summary" });
  }
};

export const getCashierTodaySales = async (req, res) => {
  try {
    const { cashierId } = req.query;

    if (!cashierId) {
      return res.status(400).json({ message: "cashierId is required" });
    }

    // Define start and end of "today"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find all completed (non-voided) orders for today and this cashier
    const orders = await Order.find({
      cashier: cashierId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      isVoided: { $ne: true },
    });

    if (!orders.length) {
      return res.json({
        date: startOfDay.toISOString().split("T")[0],
        totalSales: 0,
        totalOrders: 0,
        totalItems: 0,
        averageOrderValue: 0,
        cashPayments: 0,
        cardPayments: 0,
        topProducts: [],
      });
    }

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    // Calculate payment breakdown
    const paymentGroups = orders.reduce(
      (acc, o) => {
        if (o.paymentMethod === "cash") acc.cash += o.total;
        else if (o.paymentMethod === "card") acc.card += o.total;
        return acc;
      },
      { cash: 0, card: 0 }
    );

    // Find top 5 sold products
    const productMap = {};
    orders.forEach((o) =>
      o.items.forEach((i) => {
        if (!productMap[i.name])
          productMap[i.name] = { quantity: 0, revenue: 0 };
        productMap[i.name].quantity += i.quantity;
        productMap[i.name].revenue += i.price * i.quantity;
      })
    );

    const topProducts = Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      date: startOfDay.toISOString().split("T")[0],
      totalSales,
      totalOrders,
      totalItems,
      averageOrderValue: totalSales / totalOrders,
      cashPayments: paymentGroups.cash,
      cardPayments: paymentGroups.card,
      topProducts,
    });
  } catch (err) {
    console.error("❌ Cashier Today Sales Error:", err);
    res.status(500).json({ message: "Failed to fetch cashier today's sales" });
  }
};

export const getEarningsReport = async (req, res) => {
  try {
    // ✅ Fetch the 7 most recent non-voided, non-refunded orders
    const orders = await Order.find({
      isVoided: { $ne: true },
      isRefunded: { $ne: true },
    })
      .sort({ createdAt: -1 }) // newest first
      .limit(7)
      .populate({
        path: "items.product",
        populate: {
          path: "ingredients.material",
          model: "RawMaterial",
        },
      });

    // Reverse to display oldest → newest in chart
    orders.reverse();

    const dailyEarnings = {};

    for (const order of orders) {
      const d = order.createdAt;
      const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;

      if (!dailyEarnings[dateKey]) dailyEarnings[dateKey] = { revenue: 0, cost: 0 };

      for (const item of order.items) {
        const product = item.product;
        if (!product) continue;
        const quantitySold = item.quantity;
        const salePrice = item.price || product.price;

        dailyEarnings[dateKey].revenue += salePrice * quantitySold;

        // Calculate raw material costs
        if (product.ingredients?.length) {
          for (const ing of product.ingredients) {
            const material = ing.material;
            if (!material) continue;
            const materialCost =
              (material.costPerUnit || 0) * (ing.quantity || 0) * quantitySold;
            dailyEarnings[dateKey].cost += materialCost;
          }
        }
      }
    }

    // Convert to chart-friendly format
    const formattedData = Object.entries(dailyEarnings)
      .map(([date, values]) => ({
        date,
        earnings: values.revenue - values.cost,
      }))
      .sort((a, b) => {
        const [aM, aD] = a.date.split("/").map(Number);
        const [bM, bD] = b.date.split("/").map(Number);
        return aM === bM ? aD - bD : aM - bM;
      });

    res.json(formattedData);
  } catch (err) {
    console.error("❌ Earnings Report Error:", err);
    res.status(500).json({ message: "Failed to calculate earnings report" });
  }
};

// sales report export
// --- Helper Utilities ---
function startEndForRange(range) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch ((range || "daily").toLowerCase()) {
    case "weekly":
      start.setDate(start.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(start.getMonth() - 1);
      break;
    case "quarterly":
      start.setMonth(start.getMonth() - 3);
      break;
    case "yearly":
    case "annual":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  return { start, end };
}

function previousPeriod(start, end) {
  const durationMs = end - start;
  const prevEnd = new Date(start - 1);
  const prevStart = new Date(prevEnd - durationMs);
  return { prevStart, prevEnd };
}

function cleanValue(v) {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

const safeNum = (v) => Number(v || 0);

export const exportSalesReport = async (req, res) => {
  try {
    const { range = "monthly" } = req.query;
    const { start, end } = startEndForRange(range);
    const endDay = new Date(end);
    endDay.setHours(23, 59, 59, 999);

    // Fetch current and previous period orders
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: endDay },
      isVoided: { $ne: true },
      isRefunded: { $ne: true },
    })
      .populate("items.product")
      .populate("cashier");

    const { prevStart, prevEnd } = previousPeriod(start, endDay);
    const prevOrders = await Order.find({
      createdAt: { $gte: prevStart, $lte: prevEnd },
      isVoided: { $ne: true },
      isRefunded: { $ne: true },
    });

    // --- Totals ---
    const totalRevenue = orders.reduce((s, o) => s + safeNum(o.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce(
      (s, o) => s + o.items.reduce((sum, i) => sum + safeNum(i.quantity), 0),
      0
    );
    const prevRevenue = prevOrders.reduce((s, o) => s + safeNum(o.total), 0);
    const revenueChange =
      prevRevenue === 0
        ? totalRevenue > 0
          ? 100
          : 0
        : ((totalRevenue - prevRevenue) / prevRevenue) * 100;

    // --- Product Metrics ---
    const productMap = {};
    for (const o of orders) {
      for (const it of o.items) {
        const prod = it.product;
        const key = prod ? String(prod._id) : `deleted-${it.name || "unknown"}`;
        if (!productMap[key]) {
          productMap[key] = {
            productId: prod ? prod._id : null,
            name: prod ? prod.name : it.name || "Deleted Product",
            revenue: 0,
            quantity: 0,
            cost: 0,
          };
        }
        const qty = safeNum(it.quantity);
        const price = safeNum(it.price || (prod ? prod.price : 0));
        productMap[key].revenue += price * qty;
        productMap[key].quantity += qty;
      }
    }

    // --- Compute Cost and Profit ---
    const productIds = Object.values(productMap)
      .map((p) => p.productId)
      .filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).populate(
      "ingredients.material"
    );

    for (const prod of products) {
      const key = String(prod._id);
      if (!productMap[key]) continue;
      let perUnitCost = 0;
      if (Array.isArray(prod.ingredients)) {
        for (const ing of prod.ingredients) {
          const material = ing.material;
          perUnitCost +=
            safeNum(material?.costPerUnit) * safeNum(ing.quantity);
        }
      }
      productMap[key].cost = perUnitCost * productMap[key].quantity;
    }

    const productRows = Object.values(productMap)
      .map((p) => ({
        ...p,
        profit: p.revenue - p.cost,
        margin: p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // --- Trend Data ---
    const trendMap = {};
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const str = d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
      if (!trendMap[str])
        trendMap[str] = { date: str, sales: 0, orders: 0, items: 0 };
      trendMap[str].sales += safeNum(o.total);
      trendMap[str].orders++;
      trendMap[str].items += o.items.reduce(
        (s, i) => s + safeNum(i.quantity),
        0
      );
    }
    const trendRows = Object.values(trendMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // --- Cashiers ---
    const cashierAgg = {};
    for (const o of orders) {
      const cashier =
        o.cashier && o.cashier._id ? String(o.cashier._id) : "Unknown";
      if (!cashierAgg[cashier])
        cashierAgg[cashier] = {
          name: o.cashier?.name || "Unknown",
          total: 0,
          orders: 0,
        };
      cashierAgg[cashier].total += safeNum(o.total);
      cashierAgg[cashier].orders++;
    }
    const cashierRows = Object.entries(cashierAgg).map(([id, v]) => ({
      id,
      ...v,
    }));

    // --- Low Stock ---
    const lowStockProducts = await Product.find({
      quantity: { $lte: 5 },
    }).select("name quantity");

    const materials = await RawMaterial.find().select(
      "name quantity unit costPerUnit"
    );
    const LOW_STOCK_THRESHOLDS = {
      kilograms: 2,
      grams: 100,
      liters: 1,
      milliliters: 200,
      pieces: 5,
      packs: 3,
    };
    const lowStockMaterials = materials.filter(
      (m) => safeNum(m.quantity) < (LOW_STOCK_THRESHOLDS[m.unit] || 5)
    );

    // --- Excel Report ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sisig ni Law - POS";
    const summary = workbook.addWorksheet("Summary");

    // Add a styled title at the top
    summary.mergeCells("A1", "B1");
    const titleCell = summary.getCell("A1");
    titleCell.value = "Sisig ni Law Sales Report Analysis";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summary.addRow([]); // spacer row

    // Summary Sheet
    summary.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 25 },
    ];
    [
      ["Range", range],
      ["Start", start.toLocaleDateString("en-PH")],
      ["End", endDay.toLocaleDateString("en-PH")],
      ["Total Revenue (₱)", totalRevenue.toFixed(2)],
      ["Previous Revenue (₱)", prevRevenue.toFixed(2)],
      ["Revenue Change (%)", revenueChange.toFixed(2)],
      ["Total Orders", totalOrders],
      ["Items Sold", totalItems],
    ].forEach(([metric, value]) => summary.addRow({ metric: cleanValue(metric), value: cleanValue(value) }));

    // Trend Sheet + Chart
    const trend = workbook.addWorksheet("Sales Trend");
    trend.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Sales (₱)", key: "sales", width: 15 },
      { header: "Orders", key: "orders", width: 10 },
      { header: "Items", key: "items", width: 10 },
    ];
    trendRows.forEach((r) => trend.addRow(r));

    // Top Products + Chart
    const top = workbook.addWorksheet("Top Products");
    top.columns = [
      { header: "Product Name", key: "name", width: 25 },
      { header: "Qty Sold", key: "quantity", width: 12 },
      { header: "Revenue (₱)", key: "revenue", width: 15 },
      { header: "Profit (₱)", key: "profit", width: 15 },
      { header: "Margin (%)", key: "margin", width: 12 },
    ];
    productRows.forEach((r) => top.addRow(r));

    // --- Items Ordered (safe casting)
const itemsSheet = workbook.addWorksheet("Items Ordered");
itemsSheet.columns = [
  { header: "Order ID", key: "orderId", width: 25 },
  { header: "Product Name", key: "productName", width: 30 },
  { header: "Quantity", key: "quantity", width: 12 },
  { header: "Unit Price (₱)", key: "price", width: 15 },
  { header: "Subtotal (₱)", key: "subtotal", width: 15 },
  { header: "Date", key: "date", width: 20 },
];

orders.forEach((o) => {
  const orderId = String(o._id || "N/A");
  const orderDate = new Date(o.createdAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
  });
  o.items.forEach((it) => {
    const productName = String(it.product?.name || it.name || "Unknown");
    const quantity = Number(it.quantity || 0);
    const price = Number(it.price || 0);
    const subtotal = quantity * price;

    itemsSheet.addRow({
      orderId,
      productName,
      quantity,
      price,
      subtotal,
      date: orderDate,
    });
  });
});

// --- Items Sold Summary
const itemsSummary = workbook.addWorksheet("Items Sold Summary");
itemsSummary.columns = [
  { header: "Product Name", key: "name", width: 30 },
  { header: "Total Quantity Sold", key: "quantity", width: 20 },
  { header: "Total Revenue (₱)", key: "revenue", width: 20 },
  { header: "Total Cost (₱)", key: "cost", width: 20 },
  { header: "Profit (₱)", key: "profit", width: 20 },
  { header: "Margin (%)", key: "margin", width: 15 },
];

productRows.forEach((p) => itemsSummary.addRow({
  name: p.name,
  quantity: p.quantity,
  revenue: p.revenue,
  cost: p.cost,
  profit: p.profit,
  margin: p.margin.toFixed(2),
}));

// --- Cashiers (safe casting)
const cashiers = workbook.addWorksheet("Cashiers");
cashiers.columns = [
  { header: "Cashier", key: "name", width: 25 },
  { header: "Total Sales (₱)", key: "total", width: 15 },
  { header: "Orders", key: "orders", width: 10 },
];

cashierRows.forEach((r) =>
  cashiers.addRow({
    name: String(r.name || "Unknown"),
    total: Number(r.total || 0),
    orders: Number(r.orders || 0),
  })
);


    // Low Stock
    const low = workbook.addWorksheet("Low Stock");
    low.addRow(["Products ≤ 5"]);
    low.addRow(["Name", "Quantity"]);
    lowStockProducts.forEach((p) => low.addRow([p.name, p.quantity]));
    low.addRow([]);
    low.addRow(["Raw Materials Below Threshold"]);
    low.addRow(["Name", "Quantity", "Unit", "CostPerUnit"]);
    lowStockMaterials.forEach((m) =>
      low.addRow([m.name, m.quantity, m.unit, m.costPerUnit])
    );

    // --- Generate File ---
    const fileName = `Sales_Report_${range}_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error("❌ Export Error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
};