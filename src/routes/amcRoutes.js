const express = require('express');
const router = express.Router();
const { createAMC, getAllAMCs } = require('../controllers/amcController');

router.post('/', createAMC);
router.get('/', getAllAMCs);

module.exports = router;