const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  getProducts, 
  updateProduct,
  addSerialItem, 
  checkWarranty 
} = require('../controllers/inventoryController');

router.post('/products', createProduct);
router.get('/products', getProducts);
router.put('/products/:id', updateProduct);
router.post('/serials', addSerialItem);
router.get('/warranty/:serialNumber', checkWarranty);

module.exports = router;