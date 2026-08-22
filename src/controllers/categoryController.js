const prisma = require('../db');

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name: name.trim(), description }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: "Category already exists or invalid data" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true },
      orderBy: { name: 'asc' }
    });

    // Default categories add if none exists
    if (categories.length === 0) {
      const defaults = ['IP Cameras', 'Analog HD Cameras', 'NVR & DVRs', 'Surveillance Hard Drives', 'Power Supplies & Adapters', 'Cables & Conduits', 'Network Switches & Routers', 'Installation & Labor Services'];
      for (const d of defaults) {
        await prisma.category.create({ data: { name: d } });
      }
      const refreshed = await prisma.category.findMany({ include: { products: true }, orderBy: { name: 'asc' } });
      return res.json(refreshed);
    }

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};