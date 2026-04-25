const express = require('express');
const router = express.Router();

const binRoutes = require('./binRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const portalRoutes = require('./portalRoutes');

router.use('/', binRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/portal', portalRoutes);

module.exports = router;
