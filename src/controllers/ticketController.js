const prisma = require('../db');

// Create a Support / Service Ticket
exports.createTicket = async (req, res) => {
  try {
    const { customerId, title, issueType, priority } = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        customerId: parseInt(customerId),
        title,
        issueType: issueType || 'CCTV',
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      },
      include: { customer: true }
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Ticket Status (Resolve / In Progress)
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};