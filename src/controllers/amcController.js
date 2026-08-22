const prisma = require('../db');

// Create New AMC Contract
exports.createAMC = async (req, res) => {
  try {
    const { customerId, contractTitle, startDate, durationMonths, annualFee, visitFrequency } = req.body;

    const start = new Date(startDate || new Date());
    const end = new Date(start);
    end.setMonth(end.getMonth() + (parseInt(durationMonths) || 12));

    const amc = await prisma.aMC.create({
      data: {
        customerId: parseInt(customerId),
        contractTitle,
        startDate: start,
        endDate: end,
        annualFee: parseFloat(annualFee),
        visitFrequency: visitFrequency || 'QUARTERLY',
        status: 'ACTIVE'
      },
      include: { customer: true }
    });

    res.status(201).json(amc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All AMC Contracts with Expiry Days Calculation
exports.getAllAMCs = async (req, res) => {
  try {
    const amcs = await prisma.aMC.findMany({
      include: { customer: true },
      orderBy: { endDate: 'asc' }
    });

    const today = new Date();
    const formattedAMCs = amcs.map((item) => {
      const diffTime = new Date(item.endDate) - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status = item.status;
      if (daysRemaining <= 0) {
        status = 'EXPIRED';
      }

      return {
        ...item,
        daysRemaining,
        isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
        status
      };
    });

    res.json(formattedAMCs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};