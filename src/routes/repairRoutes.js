const express = require('express');
const router = express.Router();
const { 
  createRepairJob, 
  getRepairJobs, 
  updateRepairJob 
} = require('../controllers/repairController');

router.post('/', createRepairJob);
router.get('/', getRepairJobs);
router.patch('/:id', updateRepairJob);

module.exports = router;