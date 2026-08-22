const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, completeJob } = require('../controllers/jobController');

router.post('/', createJob);
router.get('/', getAllJobs);
router.patch('/:id/complete', completeJob);

module.exports = router;