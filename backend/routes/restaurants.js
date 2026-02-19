const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurant);
router.get('/:id/availability', restaurantController.checkAvailability);

router.use(protect);
router.post('/', restrictTo('admin', 'super_admin'), restaurantController.createRestaurant);
router.put('/:id', restrictTo('admin', 'super_admin'), restaurantController.updateRestaurant);
router.delete('/:id', restrictTo('super_admin'), restaurantController.deleteRestaurant);

module.exports = router;
