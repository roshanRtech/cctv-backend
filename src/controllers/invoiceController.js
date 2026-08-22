const prisma = require('../db');

// 1. Create Standard Itemized Invoice
exports.createInvoice = async (req, res) => {
  try {
    const { 
      customerId, description, items = {}, cableMeters = 0, cableRate = 150, 
      laborCharge = 0, discount = 0, paidAmount = 0, paymentMethod = 'CASH' 
    } = req.body;

    const camerasTotal = (items.cameras?.qty || 0) * (items.cameras?.unitPrice || 0);
    const nvrTotal = (items.nvr?.qty || 0) * (items.nvr?.unitPrice || 0);
    const hddTotal = (items.hdd?.qty || 0) * (items.hdd?.unitPrice || 0);
    const psTotal = (items.powerSupply?.qty || 0) * (items.powerSupply?.unitPrice || 0);
    const cablingCost = Number(cableMeters) * Number(cableRate);

    let subTotal = camerasTotal + nvrTotal + hddTotal + psTotal + cablingCost + Number(laborCharge);
    let totalAmount = Math.max(0, subTotal - Number(discount));

    if (req.body.totalAmount && subTotal === 0) {
      totalAmount = parseFloat(req.body.totalAmount);
    }

    const paid = parseFloat(paidAmount) || 0;
    const balance = Math.max(0, totalAmount - paid);

    let paymentStatus = 'UNPAID';
    if (paid >= totalAmount && totalAmount > 0) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    const timestamp = Date.now().toString().slice(-4);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}`;

    const itemsJson = JSON.stringify({
      items, cableMeters: Number(cableMeters), cableRate: Number(cableRate),
      laborCharge: Number(laborCharge), discount: Number(discount), grandTotal: totalAmount
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber, customerId: parseInt(customerId),
        description: description || 'CCTV & IT Solutions Installation',
        itemsJson, totalAmount, paidAmount: paid, balanceDue: balance,
        paymentStatus, paymentMethod
      },
      include: { customer: true }
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All Invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Settle Balance Payment
exports.recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid } = req.body;

    const existing = await prisma.invoice.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: "Invoice not found" });

    const newPaid = existing.paidAmount + parseFloat(amountPaid);
    const newBalance = Math.max(0, existing.totalAmount - newPaid);
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

    const updated = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { paidAmount: newPaid, balanceDue: newBalance, paymentStatus: newStatus }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Create Fast POS Order & Deduct Stock
exports.createPOSInvoice = async (req, res) => {
  try {
    const { customerId, cartItems = [], discount = 0, paymentMethod = 'CASH', paidAmount } = req.body;

    let subTotal = 0;
    const lines = [];

    for (const item of cartItems) {
      subTotal += (item.unitPrice * item.qty);
      lines.push({
        productId: item.id,
        productName: item.modelName,
        quantity: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.qty
      });
    }

    const grandTotal = Math.max(0, subTotal - Number(discount));
    const paid = paidAmount !== undefined ? parseFloat(paidAmount) : grandTotal;
    const balance = Math.max(0, grandTotal - paid);

    let paymentStatus = 'UNPAID';
    if (paid >= grandTotal && grandTotal > 0) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    // Handle Walk-in Customer if no customer selected
    let finalCustomerId = customerId ? parseInt(customerId) : null;
    if (!finalCustomerId) {
      let walkIn = await prisma.customer.findFirst({ where: { name: 'Walk-in Customer' } });
      if (!walkIn) {
        walkIn = await prisma.customer.create({ 
          data: { name: 'Walk-in Customer', phone: '0000000000', address: 'Direct Store Sale' } 
        });
      }
      finalCustomerId = walkIn.id;
    }

    const timestamp = Date.now().toString().slice(-4);
    const invoiceNumber = `POS-${new Date().getFullYear()}-${timestamp}`;

    const itemsJson = JSON.stringify({
      lines, subTotal, discount: Number(discount), grandTotal
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber, customerId: finalCustomerId,
        description: 'POS Retail Sale', itemsJson,
        totalAmount: grandTotal, paidAmount: paid, balanceDue: balance,
        paymentStatus, paymentMethod
      },
      include: { customer: true }
    });

    // Auto Deduct Live Stock from Warehouse
    for (const item of cartItems) {
      await prisma.product.update({
        where: { id: item.id },
        data: { stockQty: { decrement: item.qty } }
      });
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error("POS Error:", error);
    res.status(500).json({ error: error.message });
  }
};