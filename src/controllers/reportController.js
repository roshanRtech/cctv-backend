const prisma = require('../db');

exports.getComprehensiveReports = async (req, res) => {
  try {
    const [invoices, purchases, products, customers] = await Promise.all([
      prisma.invoice.findMany({ 
        include: { customer: true }, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.purchase.findMany({ 
        include: { supplier: true, items: { include: { product: true } } }, 
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.product.findMany({ 
        include: { category: true }, 
        orderBy: { stockQty: 'asc' } 
      }),
      prisma.customer.findMany()
    ]);

    // 1. Sales Metrics
    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const totalDue = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);

    // 2. Purchase Metrics
    const totalPurchased = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalPurchasePaid = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    // 3. Stock / Inventory Metrics
    let totalStockCostValue = 0;
    let totalStockSalesValue = 0;
    let lowStockItems = [];

    products.forEach(p => {
      const costVal = (p.costPrice || 0) * (p.stockQty || 0);
      const saleVal = (p.unitPrice || 0) * (p.stockQty || 0);
      totalStockCostValue += costVal;
      totalStockSalesValue += saleVal;
      if (p.stockQty <= p.minStockAlert) {
        lowStockItems.push(p);
      }
    });

    // 4. Profit & Loss (COGS Breakdown)
    let totalEstimatedCOGS = 0;
    invoices.forEach(inv => {
      if (inv.itemsJson) {
        try {
          const details = typeof inv.itemsJson === 'string' ? JSON.parse(inv.itemsJson) : inv.itemsJson;
          if (details.totalProjectCost) {
            totalEstimatedCOGS += Number(details.totalProjectCost);
          } else if (details.lines && Array.isArray(details.lines)) {
            details.lines.forEach(l => {
              totalEstimatedCOGS += (Number(l.costPrice || 0) * Number(l.quantity || 1));
            });
          }
        } catch (e) {}
      }
    });

    if (totalEstimatedCOGS === 0 && totalInvoiced > 0) {
      totalEstimatedCOGS = totalPurchased > 0 ? Math.min(totalPurchased, totalInvoiced * 0.65) : totalInvoiced * 0.65;
    }

    const grossProfit = Math.max(0, totalInvoiced - totalEstimatedCOGS);
    const profitMarginPercentage = totalInvoiced > 0 ? ((grossProfit / totalInvoiced) * 100).toFixed(1) : 0;

    res.json({
      summary: {
        totalInvoiced,
        totalCollected,
        totalDue,
        totalPurchased,
        totalPurchasePaid,
        totalStockCostValue,
        totalStockSalesValue,
        potentialStockProfit: totalStockSalesValue - totalStockCostValue,
        totalEstimatedCOGS,
        grossProfit,
        profitMarginPercentage
      },
      invoices,
      purchases,
      products,
      lowStockItems
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: error.message });
  }
};