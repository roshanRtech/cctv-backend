const express = require('express');
const router = express.Router();
const { createPurchase, getAllPurchases } = require('../controllers/purchaseController');

router.post('/', createPurchase);
router.get('/', getAllPurchases);

module.exports = router;