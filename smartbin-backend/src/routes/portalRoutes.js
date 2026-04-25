const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');

router.get('/reports', portalController.getReports);
router.post('/reports', portalController.submitReport);
router.get('/ratings', portalController.getRatings);
router.post('/ratings', portalController.submitRating);
router.get('/stats', portalController.getStats);

module.exports = router;
