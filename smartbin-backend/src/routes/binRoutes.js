const express = require('express');
const router = express.Router();
const binController = require('../controllers/binController');

router.get('/stats', binController.getStats);
router.get('/bins', binController.getBins);
router.get('/motion/recent', binController.getRecentMotion);
router.get('/alerts', binController.getAlerts);

module.exports = router;
