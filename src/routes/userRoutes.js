const express = require('express');
const router = express.Router();
const { createUser, getTechnicians } = require('../controllers/userController');

router.post('/', createUser);
router.get('/technicians', getTechnicians);

module.exports = router;