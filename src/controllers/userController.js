const prisma = require('../db');
const bcrypt = require('bcryptjs');

// Create New User (Technician / Sales / Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'TECHNICIAN'
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Technicians
exports.getTechnicians = async (req, res) => {
  try {
    const technicians = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: { id: true, name: true, email: true, role: true, jobs: true }
    });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};