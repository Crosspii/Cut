// File: backend/routes/reviews.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/barber/:barberId', reviewController.getBarberReviews);
router.get('/barber/:barberId/stats', reviewController.getBarberStats);

// Protected routes (auth required)
router.use(authenticateToken);

// Create new review (customers only)
router.post('/', reviewController.createReview);

// Get my reviews
router.get('/my-reviews', reviewController.getMyReviews);

// Check if booking can be reviewed
router.get('/can-review/:bookingId', reviewController.checkCanReview);

// Test endpoint to check database connection
router.get('/test', (req, res) => {
    const db = require('../config/database');
    db.query('SELECT 1 as test')
        .then(() => {
            res.json({ success: true, message: 'Database connection OK' });
        })
        .catch(err => {
            console.error('Database test error:', err);
            res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
        });
});

// Test endpoint to check reviews table
router.get('/test-table', (req, res) => {
    const db = require('../config/database');
    db.query('DESCRIBE reviews')
        .then((result) => {
            res.json({ success: true, message: 'Reviews table exists', columns: result });
        })
        .catch(err => {
            console.error('Reviews table test error:', err);
            res.status(500).json({ success: false, message: 'Reviews table not found', error: err.message });
        });
});

module.exports = router;
