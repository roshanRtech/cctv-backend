const prisma = require('../db');

exports.createSupplier = async (req, res) => {
  try {
    const { name, companyName, phone, email, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, companyName, phone, email, address }
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { purchases: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};