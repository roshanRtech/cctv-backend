const express = require('express');
const router = express.Router();
const {
  createQuotation,
  getAllQuotations,
  convertQuotationToInvoice
} = require('../controllers/quotationController');

router.post('/', createQuotation);
router.get('/', getAllQuotations);
router.post('/:id/convert', convertQuotationToInvoice);

module.exports = router;