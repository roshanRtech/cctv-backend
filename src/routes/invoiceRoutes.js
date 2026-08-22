const express = require('express');
const router = express.Router();
const { createInvoice, getAllInvoices, recordPayment, createPOSInvoice } = require('../controllers/invoiceController');

router.post('/', createInvoice);
router.post('/pos', createPOSInvoice);
router.get('/', getAllInvoices);
router.patch('/:id/pay', recordPayment);

module.exports = router;