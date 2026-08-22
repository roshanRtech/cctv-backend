const express = require('express');
const router = express.Router();
const { logActivity, getLogs } = require('../controllers/auditController');

router.post('/', logActivity);
router.get('/', getLogs);

module.exports = router;