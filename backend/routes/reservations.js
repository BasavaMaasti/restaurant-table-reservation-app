const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/my', reservationController.getMyReservations);
router.get('/:id', reservationController.getReservation);
router.post('/', reservationController.createReservation);
router.patch('/:id', reservationController.updateReservation);
router.patch('/:id/cancel', reservationController.cancelReservation);
router.patch('/:id/status', restrictTo('admin', 'super_admin'), reservationController.updateStatus);

module.exports = router;
