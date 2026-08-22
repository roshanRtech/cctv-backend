const prisma = require('../db');

// Create a new Job Card
exports.createJob = async (req, res) => {
  try {
    const { title, description, customerId, technicianId } = req.body;
    
    const job = await prisma.job.create({
      data: {
        title,
        description,
        customerId: parseInt(customerId),
        technicianId: technicianId ? parseInt(technicianId) : null,
        status: 'PENDING'
      },
      include: { customer: true, technician: true }
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all jobs with Customer & Technician relations
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        customer: true,
        technician: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete Job and Auto-Register / Update Serial Items for Warranty
exports.completeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sitePhotoUrl, customerSign, installedSerialNumbers } = req.body;

    const updatedJob = await prisma.job.update({
      where: { id: parseInt(id) },
      data: {
        status: status || 'COMPLETED',
        sitePhotoUrl,
        customerSign
      }
    });

    if (installedSerialNumbers && Array.isArray(installedSerialNumbers) && installedSerialNumbers.length > 0) {
      // Find or create a default product model if none exists
      let defaultProduct = await prisma.product.findFirst();
      if (!defaultProduct) {
        defaultProduct = await prisma.product.create({
          data: {
            modelName: 'Standard CCTV Camera / Device',
            category: 'CCTV',
            unitPrice: 6500
          }
        });
      }

      for (const serial of installedSerialNumbers) {
        const cleanSerial = serial.trim();
        if (!cleanSerial) continue;

        const existingItem = await prisma.serialItem.findUnique({
          where: { serialNumber: cleanSerial }
        });

        if (existingItem) {
          await prisma.serialItem.update({
            where: { serialNumber: cleanSerial },
            data: {
              status: 'INSTALLED',
              customerId: updatedJob.customerId,
              installedDate: new Date()
            }
          });
        } else {
          // If serial item doesn't exist, create it and bind to customer
          await prisma.serialItem.create({
            data: {
              serialNumber: cleanSerial,
              productId: defaultProduct.id,
              status: 'INSTALLED',
              warrantyMonths: 12,
              customerId: updatedJob.customerId,
              installedDate: new Date()
            }
          });
        }
      }
    }

    res.json({
      message: "Job completed and serial numbers registered successfully!",
      job: updatedJob
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};