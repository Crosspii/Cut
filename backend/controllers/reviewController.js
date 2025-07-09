// File: backend/controllers/reviewController.js
const Review = require('../models/Review');
const { successResponse, errorResponse } = require('../utils/helpers');

// Create new review
const createReview = async (req, res) => {
    try {
        const { booking_id, rating, comment } = req.body;
        const customer_id = req.user.id;

        // Validate review data
        const reviewData = { booking_id, rating, comment };
        const validationErrors = Review.validateReviewData(reviewData);
        
        if (validationErrors.length > 0) {
            return res.status(400).json(errorResponse('Validation failed', validationErrors));
        }

        // Check if user can review this booking
        const canReviewCheck = await Review.canReview(booking_id, customer_id);
        if (!canReviewCheck.canReview) {
            return res.status(400).json(errorResponse(canReviewCheck.reason));
        }

        // Create review
        const review = new Review({
            booking_id,
            customer_id,
            barber_id: canReviewCheck.booking.barber_id,
            rating: parseInt(rating),
            comment: comment?.trim()
        });

        const reviewId = await review.save();

        // Update barber's rating
        await Review.updateBarberRating(canReviewCheck.booking.barber_id);

        // Get the created review with full details
        const createdReview = await Review.findById(reviewId);

        res.status(201).json(successResponse(createdReview, 'Review created successfully'));

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json(errorResponse('Failed to create review'));
    }
};

// Get reviews for a barber
const getBarberReviews = async (req, res) => {
    try {
        const barberId = req.params.barberId;
        const filters = {
            min_rating: req.query.min_rating,
            page: req.query.page || 1,
            limit: req.query.limit || 10
        };

        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });

        const reviews = await Review.findByBarberId(barberId, filters);
        const stats = await Review.getBarberStats(barberId);

        res.json(successResponse({
            reviews,
            stats,
            pagination: {
                page: parseInt(filters.page || 1),
                limit: parseInt(filters.limit || 10),
                total: reviews.length
            }
        }));

    } catch (error) {
        console.error('Get barber reviews error:', error);
        res.status(500).json(errorResponse('Failed to fetch reviews'));
    }
};

// Get customer's reviews
const getMyReviews = async (req, res) => {
    try {
        const customerId = req.user.id;
        const filters = {
            page: req.query.page || 1,
            limit: req.query.limit || 10
        };

        const reviews = await Review.findByCustomerId(customerId, filters);

        res.json(successResponse({
            reviews,
            pagination: {
                page: parseInt(filters.page || 1),
                limit: parseInt(filters.limit || 10),
                total: reviews.length
            }
        }));

    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json(errorResponse('Failed to fetch your reviews'));
    }
};

// Check if booking can be reviewed
const checkCanReview = async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const customerId = req.user.id;

        const canReviewCheck = await Review.canReview(bookingId, customerId);

        res.json(successResponse(canReviewCheck));

    } catch (error) {
        console.error('Check can review error:', error);
        res.status(500).json(errorResponse('Failed to check review eligibility'));
    }
};

// Get barber rating statistics
const getBarberStats = async (req, res) => {
    try {
        const barberId = req.params.barberId;
        const stats = await Review.getBarberStats(barberId);

        res.json(successResponse(stats));

    } catch (error) {
        console.error('Get barber stats error:', error);
        res.status(500).json(errorResponse('Failed to fetch barber statistics'));
    }
};

module.exports = {
    createReview,
    getBarberReviews,
    getMyReviews,
    checkCanReview,
    getBarberStats
};
