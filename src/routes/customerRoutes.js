const express = require('express');
const router = express.Router();
const { 
  createCustomer, 
  getCustomers, 
  getCustomerLedger 
} = require('../controllers/customerController');

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id/ledger', getCustomerLedger);

module.exports = router;