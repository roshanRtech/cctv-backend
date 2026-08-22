const prisma = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "cctv_super_secret_key_2026";

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // In production, use bcrypt to compare hashed passwords!
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate secure JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '12h' } // Token expires in 12 hours
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};