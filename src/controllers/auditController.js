const prisma = require('../db');

exports.logActivity = async (req, res) => {
  try {
    const { userName, action, entityType, details } = req.body;
    const log = await prisma.activityLog.create({
      data: { userName, action, entityType, details }
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200 // Show latest 200 logs
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};