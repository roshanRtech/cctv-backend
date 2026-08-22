const express = require('express');
const router = express.Router();
const { getComprehensiveReports } = require('../controllers/reportController');

router.get('/comprehensive', getComprehensiveReports);

module.exports = router;