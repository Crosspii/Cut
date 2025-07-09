// Review System Class
class Reviews {
    static currentBookingId = null;
    static currentBarberId = null;

    // Initialize review system
    static init() {
        Reviews.loadReviewModals();
    }

    // Load review modal HTML into page
    static loadReviewModals() {
        // Check if modals already exist
        if (document.getElementById('reviewModal')) return;

        const modalHTML = `
            <!-- Review Modal -->
            <div class="modal fade" id="reviewModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-star me-2 text-warning"></i>Write a Review
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="reviewBookingInfo" class="mb-4">
                                <!-- Booking info will be populated here -->
                            </div>
                            
                            <form id="reviewForm">
                                <div class="mb-4">
                                    <label class="form-label fw-bold">How would you rate your experience?</label>
                                    <div class="rating-input text-center py-3">
                                        <div id="starRating" class="star-rating">
                                            <i class="fas fa-star star" data-rating="1"></i>
                                            <i class="fas fa-star star" data-rating="2"></i>
                                            <i class="fas fa-star star" data-rating="3"></i>
                                            <i class="fas fa-star star" data-rating="4"></i>
                                            <i class="fas fa-star star" data-rating="5"></i>
                                        </div>
                                        <div id="ratingText" class="mt-2 text-muted">Click to rate</div>
                                    </div>
                                    <input type="hidden" id="ratingValue" name="rating" required>
                                </div>

                                <div class="mb-4">
                                    <label for="reviewComment" class="form-label fw-bold">
                                        Tell others about your experience (optional)
                                    </label>
                                    <textarea class="form-control" id="reviewComment" name="comment" 
                                              rows="4" maxlength="1000"
                                              placeholder="Share details about your visit, the service quality, barber's professionalism, etc."></textarea>
                                    <div class="form-text">
                                        <span id="commentCount">0</span>/1000 characters
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-warning" id="submitReviewBtn" onclick="Reviews.submitReview()">
                                <span class="btn-text">
                                    <i class="fas fa-star me-2"></i>Submit Review
                                </span>
                                <span class="loading d-none">
                                    <i class="fas fa-spinner fa-spin me-2"></i>Submitting...
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- View Reviews Modal -->
            <div class="modal fade" id="viewReviewsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-comments me-2"></i>Customer Reviews
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="reviewsContent">
                                <!-- Reviews will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modals to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Initialize star rating functionality
        Reviews.initStarRating();
        Reviews.initCommentCounter();
    }

    // Initialize star rating interaction
    static initStarRating() {
        const stars = document.querySelectorAll('#starRating .star');
        const ratingValue = document.getElementById('ratingValue');
        const ratingText = document.getElementById('ratingText');

        const ratingTexts = {
            1: 'Poor - Not satisfied',
            2: 'Fair - Below expectations', 
            3: 'Good - Met expectations',
            4: 'Very Good - Exceeded expectations',
            5: 'Excellent - Outstanding service!'
        };

        stars.forEach(star => {
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                Reviews.highlightStars(rating);
                ratingText.textContent = ratingTexts[rating];
                ratingText.className = 'mt-2 text-warning fw-bold';
            });

            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                ratingValue.value = rating;
                Reviews.setStarRating(rating);
                ratingText.textContent = ratingTexts[rating];
                ratingText.className = 'mt-2 text-warning fw-bold';
            });
        });

        // Reset on mouse leave
        document.getElementById('starRating').addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingValue.value) || 0;
            if (currentRating > 0) {
                Reviews.setStarRating(currentRating);
                ratingText.textContent = ratingTexts[currentRating];
                ratingText.className = 'mt-2 text-warning fw-bold';
            } else {
                Reviews.highlightStars(0);
                ratingText.textContent = 'Click to rate';
                ratingText.className = 'mt-2 text-muted';
            }
        });
    }

    // Highlight stars up to rating
    static highlightStars(rating) {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star star text-warning';
            } else {
                star.className = 'far fa-star star text-muted';
            }
        });
    }

    // Set permanent star rating
    static setStarRating(rating) {
        const stars = document.querySelectorAll('#starRating .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star star text-warning';
            } else {
                star.className = 'far fa-star star text-muted';
            }
        });
    }

    // Initialize comment character counter
    static initCommentCounter() {
        const commentField = document.getElementById('reviewComment');
        const commentCount = document.getElementById('commentCount');

        if (commentField && commentCount) {
            commentField.addEventListener('input', function() {
                const count = this.value.length;
                commentCount.textContent = count;
                
                if (count > 900) {
                    commentCount.className = 'text-warning';
                } else if (count > 950) {
                    commentCount.className = 'text-danger';
                } else {
                    commentCount.className = '';
                }
            });
        }
    }

    // Open review modal for a booking
    static async openReviewModal(bookingId) {
        try {
            Reviews.currentBookingId = bookingId;

            // Check if user can review this booking
            const response = await Auth.makeRequest(`/reviews/can-review/${bookingId}`);
            
            if (!response.success || !response.data.canReview) {
                Auth.showAlert(response.data?.reason || 'Cannot review this booking', 'warning');
                return;
            }

            // Load booking info
            const bookingResponse = await Auth.makeRequest(`/bookings/${bookingId}`);
            if (bookingResponse.success) {
                Reviews.displayBookingInfo(bookingResponse.data);
                Reviews.currentBarberId = bookingResponse.data.barber_id;
            }

            // Reset form
            Reviews.resetReviewForm();

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
            modal.show();

        } catch (error) {
            console.error('Open review modal error:', error);
            Auth.showAlert('Failed to open review form. Please try again.', 'danger');
        }
    }

    // Display booking information in review modal
    static displayBookingInfo(booking) {
        const bookingInfo = document.getElementById('reviewBookingInfo');
        const appointmentDate = new Date(booking.appointment_date);

        bookingInfo.innerHTML = `
            <div class="card bg-light">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3 text-center">
                            ${booking.barber_avatar ? 
                                `<img src="${booking.barber_avatar}" alt="${booking.business_name}" class="rounded-circle mb-2" style="width: 60px; height: 60px; object-fit: cover;">` :
                                `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center mb-2 mx-auto" style="width: 60px; height: 60px;">
                                    <i class="fas fa-cut text-white fa-lg"></i>
                                </div>`
                            }
                        </div>
                        <div class="col-md-9">
                            <h6 class="mb-1">${booking.business_name}</h6>
                            <p class="mb-1"><strong>Service:</strong> ${booking.service_name}</p>
                            <p class="mb-1"><strong>Date:</strong> ${appointmentDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                            <p class="mb-0"><strong>Price:</strong> ${booking.total_price} DH</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Reset review form
    static resetReviewForm() {
        document.getElementById('ratingValue').value = '';
        document.getElementById('reviewComment').value = '';
        document.getElementById('commentCount').textContent = '0';
        Reviews.highlightStars(0);
        document.getElementById('ratingText').textContent = 'Click to rate';
        document.getElementById('ratingText').className = 'mt-2 text-muted';
    }

    // Submit review
    static async submitReview() {
        try {
            const rating = document.getElementById('ratingValue').value;
            const comment = document.getElementById('reviewComment').value.trim();

            if (!rating) {
                Auth.showAlert('Please select a rating', 'warning');
                return;
            }

            const submitBtn = document.getElementById('submitReviewBtn');
            const btnText = submitBtn.querySelector('.btn-text');
            const loading = submitBtn.querySelector('.loading');

            // Show loading state
            btnText.classList.add('d-none');
            loading.classList.remove('d-none');
            submitBtn.disabled = true;

            // Submit review
            const response = await Auth.makeRequest('/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    booking_id: Reviews.currentBookingId,
                    rating: parseInt(rating),
                    comment: comment || null
                })
            });

            if (response.success) {
                Auth.showAlert('Review submitted successfully! Thank you for your feedback.', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
                modal.hide();
                
                // Refresh any displays that show reviews
                if (typeof MyBookings !== 'undefined') {
                    MyBookings.loadBookings();
                }
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Submit review error:', error);
            Auth.showAlert(error.message || 'Failed to submit review. Please try again.', 'danger');
        } finally {
            // Reset button state
            const submitBtn = document.getElementById('submitReviewBtn');
            const btnText = submitBtn.querySelector('.btn-text');
            const loading = submitBtn.querySelector('.loading');
            
            btnText.classList.remove('d-none');
            loading.classList.add('d-none');
            submitBtn.disabled = false;
        }
    }

    // View all reviews for a barber
    static async viewBarberReviews(barberId, barberName = 'Barber') {
        try {
            const modal = new bootstrap.Modal(document.getElementById('viewReviewsModal'));
            const content = document.getElementById('reviewsContent');
            
            // Show loading
            content.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-3">Loading reviews...</p>
                </div>
            `;
            
            modal.show();

            // Load reviews and stats
            const [reviewsResponse, statsResponse] = await Promise.all([
                fetch(`/api/reviews/barber/${barberId}`),
                fetch(`/api/reviews/barber/${barberId}/stats`)
            ]);

            const reviewsData = await reviewsResponse.json();
            const statsData = await statsResponse.json();

            if (reviewsData.success && statsData.success) {
                Reviews.displayReviewsModal(reviewsData.data, statsData.data, barberName);
            } else {
                throw new Error('Failed to load reviews');
            }

        } catch (error) {
            console.error('View reviews error:', error);
            document.getElementById('reviewsContent').innerHTML = `
                <div class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>Failed to load reviews</p>
                    <button class="btn btn-outline-danger" onclick="Reviews.viewBarberReviews(${barberId}, '${barberName}')">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    // Display reviews in modal
    static displayReviewsModal(reviewsData, statsData, barberName) {
        const content = document.getElementById('reviewsContent');
        const reviews = reviewsData.reviews || [];
        const stats = statsData || {};

        const modalTitle = document.querySelector('#viewReviewsModal .modal-title');
        modalTitle.innerHTML = `<i class="fas fa-comments me-2"></i>Reviews for ${barberName}`;

        if (reviews.length === 0) {
            content.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-star fa-3x mb-3"></i>
                    <h5>No reviews yet</h5>
                    <p>Be the first to review this barber!</p>
                </div>
            `;
            return;
        }

        // Create reviews display
        content.innerHTML = `
            <!-- Rating Overview -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="text-center">
                        <div class="display-4 fw-bold text-warning">${(stats.average_rating || 0).toFixed(1)}</div>
                        <div class="rating-stars mb-2">
                            ${Reviews.generateStarDisplay(stats.average_rating || 0)}
                        </div>
                        <p class="text-muted">${stats.total_reviews || 0} reviews</p>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="rating-breakdown">
                        ${Reviews.generateRatingBreakdown(stats)}
                    </div>
                </div>
            </div>

            <hr>

            <!-- Reviews List -->
            <div class="reviews-list">
                <h6 class="mb-3">Customer Reviews</h6>
                ${reviews.map(review => Reviews.generateReviewCard(review)).join('')}
            </div>
        `;
    }

    // Generate star display
    static generateStarDisplay(rating, size = '') {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += `<i class="fas fa-star text-warning ${size}"></i>`;
        }
        
        if (hasHalfStar) {
            starsHTML += `<i class="fas fa-star-half-alt text-warning ${size}"></i>`;
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += `<i class="far fa-star text-warning ${size}"></i>`;
        }
        
        return starsHTML;
    }

    // Generate rating breakdown
    static generateRatingBreakdown(stats) {
        const total = stats.total_reviews || 0;
        if (total === 0) return '<p class="text-muted">No ratings yet</p>';

        const ratings = [
            { stars: 5, count: stats.five_star || 0 },
            { stars: 4, count: stats.four_star || 0 },
            { stars: 3, count: stats.three_star || 0 },
            { stars: 2, count: stats.two_star || 0 },
            { stars: 1, count: stats.one_star || 0 }
        ];

        return ratings.map(rating => {
            const percentage = total > 0 ? (rating.count / total * 100) : 0;
            return `
                <div class="d-flex align-items-center mb-2">
                    <div class="rating-label me-3" style="width: 60px;">
                        ${rating.stars} <i class="fas fa-star text-warning"></i>
                    </div>
                    <div class="progress flex-grow-1 me-3" style="height: 8px;">
                        <div class="progress-bar bg-warning" style="width: ${percentage}%"></div>
                    </div>
                    <div class="rating-count" style="width: 40px;">
                        ${rating.count}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Generate individual review card
    static generateReviewCard(review) {
        const reviewDate = new Date(review.created_at);
        const appointmentDate = new Date(review.appointment_date);
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-2 text-center">
                            ${review.customer_avatar ? 
                                `<img src="${review.customer_avatar}" alt="${review.customer_name}" class="rounded-circle mb-2" style="width: 50px; height: 50px; object-fit: cover;">` :
                                `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center mb-2 mx-auto" style="width: 50px; height: 50px;">
                                    <i class="fas fa-user text-white"></i>
                                </div>`
                            }
                            <div class="fw-bold">${review.customer_name}</div>
                        </div>
                        <div class="col-md-10">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <div class="rating-stars">
                                        ${Reviews.generateStarDisplay(review.rating)}
                                    </div>
                                    <small class="text-muted">
                                        ${review.service_name} • ${appointmentDate.toLocaleDateString()}
                                    </small>
                                </div>
                                <small class="text-muted">
                                    ${reviewDate.toLocaleDateString()}
                                </small>
                            </div>
                            ${review.comment ? `
                                <p class="mb-0">${review.comment}</p>
                            ` : `
                                <p class="text-muted mb-0"><em>No comment provided</em></p>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Add review functionality to booking cards
    static addReviewButton(bookingId, isReviewable = false) {
        if (!isReviewable) return '';
        
        return `
            <button class="btn btn-outline-warning btn-sm mt-1" onclick="Reviews.openReviewModal(${bookingId})">
                <i class="fas fa-star"></i> Review
            </button>
        `;
    }

    // Add view reviews button to barber cards
    static addViewReviewsButton(barberId, barberName = 'Barber') {
        return `
            <button class="btn btn-outline-primary btn-sm" onclick="Reviews.viewBarberReviews(${barberId}, '${barberName}')">
                <i class="fas fa-comments"></i> Reviews
            </button>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        Reviews.init();
    }
});

// Make Reviews available globally
window.Reviews = Reviews;
