const prisma = require('../db');

exports.createProject = async (req, res) => {
  try {
    const { title, description, customerId, totalValue, startDate, deadline } = req.body;
    
    const count = await prisma.project.count();
    const refNo = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const project = await prisma.project.create({
      data: {
        refNo,
        title,
        description,
        customerId: parseInt(customerId),
        totalValue: parseFloat(totalValue) || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        deadline: deadline ? new Date(deadline) : null,
      },
      include: { customer: true }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        status: status || undefined,
        progress: progress !== undefined ? parseInt(progress) : undefined
      },
      include: { customer: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};