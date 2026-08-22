const prisma = require('../db');
const jwt = require('jsonwebtoken');

// 1. Get Products (With Security & Role Checking)
exports.getProducts = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    let userRole = 'SALES';
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "cctv_super_secret_key_2026");
        userRole = decoded.role;
      } catch (e) { /* Ignore invalid token */ }
    }

    // Limit to 150 items to prevent server crashing (Pagination logic)
    const products = await prisma.product.findMany({
      take: 150, 
      include: { category: true },
      orderBy: { stockQty: 'desc' }
    });

    // Security: Strip Cost Price & Profit if NOT Admin
    if (userRole !== 'ADMIN') {
      products.forEach(p => {
        delete p.costPrice;
      });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Create Product
exports.createProduct = async (req, res) => {
  try {
    const { modelName, categoryId, costPrice, unitPrice, stockQty, minStockAlert } = req.body;
    const product = await prisma.product.create({
      data: {
        modelName,
        categoryId: categoryId ? parseInt(categoryId) : null,
        costPrice: parseFloat(costPrice) || 0,
        unitPrice: parseFloat(unitPrice) || 0,
        stockQty: parseInt(stockQty) || 0,
        minStockAlert: parseInt(minStockAlert) || 5
      }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Check Warranty (Restored)
exports.checkWarranty = async (req, res) => {
  try {
    const { serial } = req.params;
    const item = await prisma.serialItem.findUnique({
      where: { serialNumber: serial },
      include: { product: true, customer: true }
    });
    
    if (!item) {
      return res.status(404).json({ error: "Serial number not found" });
    }
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Add Serial Item (Restored)
exports.addSerialItem = async (req, res) => {
  try {
    const { serialNumber, productId, warrantyMonths } = req.body;
    const item = await prisma.serialItem.create({
      data: {
        serialNumber,
        productId: parseInt(productId),
        warrantyMonths: parseInt(warrantyMonths) || 12
      }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Update Product (If applicable for your system)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { modelName, unitPrice, costPrice, stockQty } = req.body;
    
    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        modelName: modelName || undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
        stockQty: stockQty ? parseInt(stockQty) : undefined,
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};