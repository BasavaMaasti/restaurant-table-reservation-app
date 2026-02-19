const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin', 'super_admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/reservations', adminController.getAllReservations);
router.get('/analytics', adminController.getAnalytics);

router.use(restrictTo('super_admin'));
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/toggle', adminController.toggleUserActive);

module.exports = router;
