const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

router.use(protect);
router.post('/', reviewController.createReview);
router.delete('/:id', reviewController.deleteReview);
router.post('/:id/reply', restrictTo('admin', 'super_admin'), reviewController.replyToReview);

module.exports = router;
