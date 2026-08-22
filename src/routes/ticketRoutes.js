const express = require('express');
const router = express.Router();
const { createTicket, getAllTickets, updateTicketStatus } = require('../controllers/ticketController');

router.post('/', createTicket);
router.get('/', getAllTickets);
router.patch('/:id', updateTicketStatus);

module.exports = router;