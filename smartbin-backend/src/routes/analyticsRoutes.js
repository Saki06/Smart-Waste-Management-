const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/trends', analyticsController.getTrends);
router.get('/correlations', analyticsController.getCorrelations);
router.get('/anomalies', analyticsController.getAnomalies);
router.get('/predictions', analyticsController.getPredictions);

module.exports = router;
