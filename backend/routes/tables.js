// tables.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/:restaurantId', tableController.getTables);
router.get('/:restaurantId/live', tableController.getLiveStatus);

router.use(protect);
router.post('/', restrictTo('admin', 'super_admin'), tableController.createTable);
router.patch('/:id', restrictTo('admin', 'super_admin'), tableController.updateTable);
router.delete('/:id', restrictTo('admin', 'super_admin'), tableController.deleteTable);

module.exports = router;
