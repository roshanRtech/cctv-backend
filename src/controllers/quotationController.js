const prisma = require('../db');

// 1. Create Dynamic Quotation with Real-time Cost & Profit Breakdown
exports.createQuotation = async (req, res) => {
  try {
    const { 
      customerId, 
      lines = [], 
      cablingMeters = 0, 
      cablingRate = 150,      // Selling Price to Customer
      cablingCostRate = 80,   // Internal Buying Cost for Wire/Casing
      laborCharge = 0,        // Selling Charge to Customer
      laborCost = 0,          // Internal Pay to Technician
      discount = 0 
    } = req.body;

    let totalHardwareSales = 0;
    let totalHardwareCost = 0;

    const formattedLines = lines.map((line) => {
      const qty = Number(line.quantity) || 1;
      const unitPrice = Number(line.unitPrice) || 0;
      const costPrice = Number(line.costPrice) || 0;
      const lineTotal = qty * unitPrice;
      const lineCost = qty * costPrice;

      totalHardwareSales += lineTotal;
      totalHardwareCost += lineCost;

      return {
        productId: line.productId ? parseInt(line.productId) : null,
        productName: line.productName,
        category: line.category || 'General',
        quantity: qty,
        unitPrice,
        costPrice,
        lineTotal,
        lineProfit: lineTotal - lineCost
      };
    });

    // Sales Calculations (For Customer)
    const cablingSalesTotal = Number(cablingMeters) * Number(cablingRate);
    const subTotal = totalHardwareSales + cablingSalesTotal + Number(laborCharge);
    const grandTotal = Math.max(0, subTotal - Number(discount));

    // Internal Cost Calculations (Hidden from Customer)
    const cablingCostTotal = Number(cablingMeters) * Number(cablingCostRate);
    const totalProjectCost = totalHardwareCost + cablingCostTotal + Number(laborCost);
    
    // Profit Calculation
    const grossProfit = grandTotal - totalProjectCost;
    const profitMargin = grandTotal > 0 ? ((grossProfit / grandTotal) * 100).toFixed(1) : 0;

    const count = await prisma.quotation.count();
    const quotationNo = `QTN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const detailsJson = JSON.stringify({
      lines: formattedLines,
      cablingMeters: Number(cablingMeters),
      cablingRate: Number(cablingRate),
      cablingCostRate: Number(cablingCostRate),
      laborCharge: Number(laborCharge),
      laborCost: Number(laborCost),
      discount: Number(discount),
      subTotal,
      grandTotal,
      totalProjectCost,
      grossProfit,
      profitMargin: parseFloat(profitMargin)
    });

    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        customerId: parseInt(customerId),
        totalAmount: grandTotal,
        detailsJson,
        status: 'PENDING'
      },
      include: { customer: true }
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All Quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = quotations.map((q, idx) => ({
      ...q,
      quotationNo: q.quotationNo || `QTN-${new Date(q.createdAt).getFullYear()}-${String(idx + 1).padStart(4, '0')}`
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Convert Quotation -> Invoice & Job Card
exports.convertQuotationToInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { advancePaid = 0, paymentMethod = 'CASH' } = req.body;

    const quote = await prisma.quotation.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true }
    });

    if (!quote) return res.status(404).json({ error: "Quotation not found" });

    const total = Number(quote.totalAmount) || 0;
    const paid = parseFloat(advancePaid) || 0;
    const balance = Math.max(0, total - paid);

    let paymentStatus = 'UNPAID';
    if (paid >= total && total > 0) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    const quoteRef = quote.quotationNo || `QTN-${quote.id}`;
    const timestamp = Date.now().toString().slice(-4);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: quote.customerId,
        description: `Project Installation (${quoteRef})`,
        itemsJson: quote.detailsJson,
        totalAmount: total,
        paidAmount: paid,
        balanceDue: balance,
        paymentStatus,
        paymentMethod
      }
    });

    const job = await prisma.job.create({
      data: {
        title: `Installation Job - Ref: ${quoteRef}`,
        description: `Automated job from quotation ${quoteRef}. Total Value: LKR ${total.toLocaleString()}`,
        customerId: quote.customerId,
        status: 'PENDING'
      }
    });

    await prisma.quotation.update({
      where: { id: quote.id },
      data: { status: 'INVOICED' }
    });

    res.json({ message: "Converted successfully!", invoice, job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};