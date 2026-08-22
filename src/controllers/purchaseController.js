const prisma = require('../db');

// Create Purchase Order & Auto Stock-In Products
exports.createPurchase = async (req, res) => {
  try {
    const { supplierId, items = [], paidAmount = 0 } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Purchase items are required" });
    }

    let totalAmount = 0;
    const purchaseItemsData = items.map((item) => {
      const lineTotal = Number(item.quantity) * Number(item.unitCost);
      totalAmount += lineTotal;
      return {
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
        unitCost: parseFloat(item.unitCost),
        totalCost: lineTotal
      };
    });

    const paid = parseFloat(paidAmount) || 0;
    let paymentStatus = 'DUE';
    if (paid >= totalAmount) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    const count = await prisma.purchase.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 1. Create Purchase Record
    const purchase = await prisma.purchase.create({
      data: {
        poNumber,
        supplierId: parseInt(supplierId),
        totalAmount,
        paidAmount: paid,
        paymentStatus,
        items: {
          create: purchaseItemsData
        }
      },
      include: { supplier: true, items: { include: { product: true } } }
    });

    // 2. Automatically Update Product Stock Quantity & Cost Price in Warehouse
    for (const item of items) {
      await prisma.product.update({
        where: { id: parseInt(item.productId) },
        data: {
          stockQty: { increment: parseInt(item.quantity) },
          costPrice: parseFloat(item.unitCost) // Update latest cost price
        }
      });
    }

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Purchase Orders
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};