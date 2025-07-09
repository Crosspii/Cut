// File: backend/models/Review.js
const db = require('../config/database');

class Review {
    constructor(reviewData) {
        this.booking_id = reviewData.booking_id;
        this.customer_id = reviewData.customer_id;
        this.barber_id = reviewData.barber_id;
        this.rating = reviewData.rating;
        this.comment = reviewData.comment;
        this.created_at = reviewData.created_at || new Date();
    }

    // Create new review
    async save() {
        try {
            const query = `
                INSERT INTO reviews (booking_id, customer_id, barber_id, rating, comment, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const result = await db.query(query, [
                this.booking_id,
                this.customer_id,
                this.barber_id,
                this.rating,
                this.comment,
                this.created_at
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Get reviews for a barber
    static async findByBarberId(barberId, filters = {}) {
        try {
            let query = `
                SELECT r.*, 
                       c.name as customer_name, 
                       c.avatar as customer_avatar,
                       b.service_name,
                       b.appointment_date
                FROM reviews r
                JOIN users c ON r.customer_id = c.id
                JOIN bookings b ON r.booking_id = b.id
                WHERE r.barber_id = ?
            `;
            const queryParams = [barberId];

            // Add rating filter
            if (filters.min_rating) {
                query += ` AND r.rating >= ?`;
                queryParams.push(parseInt(filters.min_rating));
            }

            // Order by date (newest first)
            query += ` ORDER BY r.created_at DESC`;

            // Add pagination
            const limit = parseInt(filters.limit) || 10;
            const page = parseInt(filters.page) || 1;
            const offset = (page - 1) * limit;
            
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            return await db.query(query, queryParams);
        } catch (error) {
            throw error;
        }
    }

    // Get reviews by customer
    static async findByCustomerId(customerId, filters = {}) {
        try {
            let query = `
                SELECT r.*, 
                       bp.business_name,
                       u.name as barber_name,
                       b.service_name,
                       b.appointment_date
                FROM reviews r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON r.barber_id = u.id
                JOIN barber_profiles bp ON r.barber_id = bp.user_id
                WHERE r.customer_id = ?
                ORDER BY r.created_at DESC
            `;
            const queryParams = [customerId];

            // Add pagination
            const limit = parseInt(filters.limit) || 10;
            const page = parseInt(filters.page) || 1;
            const offset = (page - 1) * limit;
            
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            return await db.query(query, queryParams);
        } catch (error) {
            throw error;
        }
    }

    // Check if booking can be reviewed
    static async canReview(bookingId, customerId) {
        try {
            // Check if booking is completed and belongs to customer
            const bookingQuery = `
                SELECT id, status, customer_id, barber_id
                FROM bookings 
                WHERE id = ? AND customer_id = ? AND status = 'completed'
            `;
            const bookings = await db.query(bookingQuery, [bookingId, customerId]);
            
            if (bookings.length === 0) {
                return { canReview: false, reason: 'Booking not found or not completed' };
            }

            // Check if already reviewed
            const reviewQuery = `SELECT id FROM reviews WHERE booking_id = ?`;
            const existingReviews = await db.query(reviewQuery, [bookingId]);
            
            if (existingReviews.length > 0) {
                return { canReview: false, reason: 'Booking already reviewed' };
            }

            return { 
                canReview: true, 
                booking: bookings[0] 
            };
        } catch (error) {
            throw error;
        }
    }

    // Get barber rating statistics
    static async getBarberStats(barberId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
                FROM reviews 
                WHERE barber_id = ?
            `;
            
            const stats = await db.query(query, [barberId]);
            return stats[0];
        } catch (error) {
            throw error;
        }
    }

    // Update barber profile with new rating
    static async updateBarberRating(barberId) {
        try {
            const stats = await Review.getBarberStats(barberId);
            
            const updateQuery = `
                UPDATE barber_profiles 
                SET average_rating = ?, total_reviews = ?
                WHERE user_id = ?
            `;
            
            await db.query(updateQuery, [
                parseFloat(stats.average_rating) || 0,
                parseInt(stats.total_reviews) || 0,
                barberId
            ]);
        } catch (error) {
            throw error;
        }
    }

    // Find review by ID
    static async findById(reviewId) {
        try {
            const query = `
                SELECT r.*, 
                       c.name as customer_name,
                       bp.business_name,
                       u.name as barber_name
                FROM reviews r
                JOIN users c ON r.customer_id = c.id
                JOIN users u ON r.barber_id = u.id
                JOIN barber_profiles bp ON r.barber_id = bp.user_id
                WHERE r.id = ?
            `;
            
            const reviews = await db.query(query, [reviewId]);
            return reviews.length > 0 ? reviews[0] : null;
        } catch (error) {
            throw error;
        }
    }

    // Validate review data
    static validateReviewData(data) {
        const errors = [];

        if (!data.booking_id) {
            errors.push('Booking ID is required');
        }

        if (!data.rating || data.rating < 1 || data.rating > 5) {
            errors.push('Rating must be between 1 and 5');
        }

        if (data.comment && data.comment.length > 1000) {
            errors.push('Comment must be less than 1000 characters');
        }

        return errors;
    }
}

module.exports = Review;
