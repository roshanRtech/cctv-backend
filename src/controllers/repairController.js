const prisma = require('../db');

// 1. Create New Repair Inward Job
exports.createRepairJob = async (req, res) => {
  try {
    const { 
      customerId, deviceType, brandModel, serialNumber, 
      accessories, reportedIssue, isRMA = false, rmaAgentName 
    } = req.body;

    const count = await prisma.repairJob.count();
    const tokenNo = `REP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const repair = await prisma.repairJob.create({
      data: {
        tokenNo,
        customerId: parseInt(customerId),
        deviceType: deviceType || 'NVR/DVR',
        brandModel: brandModel.trim(),
        serialNumber: serialNumber ? serialNumber.trim() : null,
        accessories: accessories ? accessories.trim() : 'Device Only',
        reportedIssue: reportedIssue.trim(),
        isRMA: Boolean(isRMA),
        rmaAgentName: rmaAgentName ? rmaAgentName.trim() : null,
        status: isRMA ? 'RMA_SENT' : 'RECEIVED'
      },
      include: { customer: true }
    });

    res.status(201).json(repair);
  } catch (error) {
    console.error("Create repair error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All Repair Jobs
exports.getRepairJobs = async (req, res) => {
  try {
    const repairs = await prisma.repairJob.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(repairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Update Repair Status, Diagnostics, RMA Claim & Costs
exports.updateRepairJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, technicianNotes, isRMA, rmaAgentName, rmaTrackingNo, 
      replacementSerial, sparePartsCost, laborCharge, isPaid 
    } = req.body;

    const spares = parseFloat(sparePartsCost) || 0;
    const labor = parseFloat(laborCharge) || 0;
    const totalCost = spares + labor;

    const updated = await prisma.repairJob.update({
      where: { id: parseInt(id) },
      data: {
        status: status || undefined,
        technicianNotes: technicianNotes !== undefined ? technicianNotes : undefined,
        isRMA: isRMA !== undefined ? Boolean(isRMA) : undefined,
        rmaAgentName: rmaAgentName !== undefined ? rmaAgentName : undefined,
        rmaTrackingNo: rmaTrackingNo !== undefined ? rmaTrackingNo : undefined,
        replacementSerial: replacementSerial !== undefined ? replacementSerial : undefined,
        sparePartsCost: spares,
        laborCharge: labor,
        totalCost: totalCost,
        isPaid: isPaid !== undefined ? Boolean(isPaid) : undefined
      },
      include: { customer: true }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};