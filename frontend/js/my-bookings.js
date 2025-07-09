// My Bookings management class
class MyBookings {
    static allBookings = [];
    static filteredBookings = [];
    static currentFilter = 'all';
    static bookingToCancel = null;

    // Initialize the bookings page
    static init() {
        MyBookings.loadBookings();
    }

    // Load user's bookings
    static async loadBookings() {
        try {
            MyBookings.showLoading();

            const response = await Auth.makeRequest('/bookings/my-bookings');
            
            if (response.success) {
                MyBookings.allBookings = response.data.bookings || [];
                MyBookings.filterBookings(MyBookings.currentFilter);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Load bookings error:', error);
            Auth.showAlert('Failed to load bookings. Please try again.', 'danger');
        } finally {
            MyBookings.hideLoading();
        }
    }

    // Filter bookings by status
    static filterBookings(filter) {
        MyBookings.currentFilter = filter;
        
        if (filter === 'all') {
            MyBookings.filteredBookings = MyBookings.allBookings;
        } else if (filter === 'upcoming') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            MyBookings.filteredBookings = MyBookings.allBookings.filter(booking => {
                const bookingDate = new Date(booking.appointment_date);
                return bookingDate >= today && ['pending', 'confirmed'].includes(booking.status);
            });
        } else {
            MyBookings.filteredBookings = MyBookings.allBookings.filter(booking => 
                booking.status === filter
            );
        }

        MyBookings.displayBookings();
    }

    // Display bookings
    static displayBookings() {
        const bookingsList = document.getElementById('bookingsList');
        const emptyState = document.getElementById('emptyState');

        if (MyBookings.filteredBookings.length === 0) {
            bookingsList.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');
        bookingsList.classList.remove('d-none');

        // Sort bookings by date (newest first)
        const sortedBookings = [...MyBookings.filteredBookings].sort((a, b) => {
            const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
            return dateB - dateA;
        });

        bookingsList.innerHTML = sortedBookings.map(booking => 
            MyBookings.createBookingCard(booking)
        ).join('');
    }

    // Create booking card HTML
    static createBookingCard(booking) {
        const bookingDate = new Date(booking.appointment_date);
        const now = new Date();
        const isPast = bookingDate < now;
        const canCancel = ['pending', 'confirmed'].includes(booking.status) && !isPast;
        const canReview = booking.status === 'completed' && isPast;

        return `
            <div class="card booking-card ${booking.status} mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center mb-3 mb-md-0">
                            <div class="fw-bold text-primary">${bookingDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                            <div class="h4">${bookingDate.getDate()}</div>
                            <div class="text-muted">${MyBookings.formatTime(booking.appointment_time)}</div>
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <div class="d-flex align-items-center">
                                ${booking.barber_avatar ? 
                                    `<img src="${booking.barber_avatar}" alt="${booking.barber_name}" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">` :
                                    `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                                        <i class="fas fa-cut text-white"></i>
                                    </div>`
                                }
                                <div>
                                    <div class="fw-bold">${booking.business_name}</div>
                                    <small class="text-muted">${booking.barber_name}</small>
                                    <!-- ADD RATING DISPLAY -->
                                    <div class="rating-display mt-1">
                                        ${MyBookings.generateStarDisplay(booking.barber_rating || 0)} 
                                        <small class="text-muted">(${booking.barber_reviews || 0})</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <div class="fw-bold">${booking.service_name}</div>
                            <small class="text-muted">${booking.service_duration} minutes</small><br>
                            <span class="text-primary fw-bold">${booking.service_price} DH</span>
                        </div>
                        <div class="col-md-2 mb-3 mb-md-0 text-center">
                            <span class="badge status-badge ${MyBookings.getStatusClass(booking.status)}">
                                ${MyBookings.getStatusText(booking.status)}
                            </span>
                            <!-- ADD REVIEW STATUS -->
                            ${booking.has_review ? `
                                <div class="mt-2">
                                    <span class="badge bg-success">
                                        <i class="fas fa-star"></i> Reviewed
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="col-md-2 text-end">
                            <div class="btn-group-vertical btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm" onclick="MyBookings.viewDetails(${booking.id})">
                                    <i class="fas fa-eye"></i> Details
                                </button>
                                ${canCancel ? `
                                    <button class="btn btn-outline-danger btn-sm mt-1" onclick="MyBookings.cancelBooking(${booking.id})">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                ` : ''}
                                ${canReview && !booking.has_review ? `
                                    <button class="btn btn-outline-warning btn-sm mt-1" onclick="Reviews.openReviewModal(${booking.id})">
                                        <i class="fas fa-star"></i> Review
                                    </button>
                                ` : ''}
                                ${booking.has_review ? `
                                    <button class="btn btn-outline-info btn-sm mt-1" onclick="MyBookings.viewMyReview(${booking.id})">
                                        <i class="fas fa-eye"></i> My Review
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline-secondary btn-sm mt-1" onclick="Reviews.viewBarberReviews(${booking.barber_id}, '${booking.business_name}')">
                                    <i class="fas fa-comments"></i> All Reviews
                                </button>
                            </div>
                        </div>
                    </div>
                    ${booking.notes ? `
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="alert alert-light py-2">
                                    <small><strong>Notes:</strong> ${booking.notes}</small>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

        // Generate star display
    static generateStarDisplay(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star text-warning"></i>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt text-warning"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star text-warning"></i>';
        }
        
        return starsHTML;
    }

    // View user's own review
    static async viewMyReview(bookingId) {
        try {
            // Get booking details first
            const bookingResponse = await Auth.makeRequest(`/bookings/${bookingId}`);
            if (!bookingResponse.success) {
                throw new Error('Failed to load booking details');
            }

            const booking = bookingResponse.data;
            
            // Get user's reviews to find this booking's review
            const reviewsResponse = await Auth.makeRequest('/reviews/my-reviews');
            if (!reviewsResponse.success) {
                throw new Error('Failed to load reviews');
            }

            const myReview = reviewsResponse.data.reviews.find(r => r.booking_id == bookingId);
            if (!myReview) {
                Auth.showAlert('Review not found', 'warning');
                return;
            }

            const reviewDate = new Date(myReview.created_at);
            const appointmentDate = new Date(booking.appointment_date);

            const reviewHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center">
                            ${booking.barber_avatar ? 
                                `<img src="${booking.barber_avatar}" alt="${booking.business_name}" class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;">` :
                                `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center mb-3 mx-auto" style="width: 80px; height: 80px;">
                                    <i class="fas fa-cut text-white fa-lg"></i>
                                </div>`
                            }
                            <h6>${booking.business_name}</h6>
                            <p class="text-muted">${myReview.service_name}</p>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="mb-3">
                            <h6>Your Rating</h6>
                            <div class="rating-display mb-2">
                                ${MyBookings.generateStarDisplay(myReview.rating)}
                                <span class="ms-2 fw-bold">${myReview.rating}/5</span>
                            </div>
                            <small class="text-muted">
                                Appointment: ${appointmentDate.toLocaleDateString()} • 
                                Reviewed: ${reviewDate.toLocaleDateString()}
                            </small>
                        </div>
                        
                        ${myReview.comment ? `
                            <div class="mb-3">
                                <h6>Your Review</h6>
                                <div class="alert alert-light">
                                    "${myReview.comment}"
                                </div>
                            </div>
                        ` : `
                            <div class="mb-3">
                                <p class="text-muted"><em>No written review provided</em></p>
                            </div>
                        `}
                        
                        <div class="mt-3">
                            <button class="btn btn-outline-primary" onclick="Reviews.viewBarberReviews(${booking.barber_id}, '${booking.business_name}')">
                                <i class="fas fa-comments"></i> View All Reviews
                            </button>
                        </div>
                    </div>
                </div>
            `;

            Auth.showModal('My Review', reviewHTML);

        } catch (error) {
            console.error('View my review error:', error);
            Auth.showAlert('Failed to load review. Please try again.', 'danger');
        }
    }

    // Get status CSS class
    static getStatusClass(status) {
        const classes = {
            pending: 'bg-warning text-dark',
            confirmed: 'bg-success',
            completed: 'bg-primary',
            cancelled: 'bg-danger',
            no_show: 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    // Get status display text
    static getStatusText(status) {
        const texts = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            completed: 'Completed',
            cancelled: 'Cancelled',
            no_show: 'No Show'
        };
        return texts[status] || status;
    }

    // Format time display
    static formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }

    // View booking details
    static viewDetails(bookingId) {
        const booking = MyBookings.allBookings.find(b => b.id === bookingId);
        if (!booking) return;

        const bookingDate = new Date(booking.appointment_date);
        
        const detailsHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-calendar me-2"></i>Appointment Details</h6>
                    <p><strong>Date:</strong> ${bookingDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                    <p><strong>Time:</strong> ${MyBookings.formatTime(booking.appointment_time)}</p>
                    <p><strong>Duration:</strong> ${booking.service_duration} minutes</p>
                    <p><strong>Service:</strong> ${booking.service_name}</p>
                    <p><strong>Price:</strong> ${booking.service_price} DH</p>
                    <p><strong>Status:</strong> 
                        <span class="badge ${MyBookings.getStatusClass(booking.status)}">
                            ${MyBookings.getStatusText(booking.status)}
                        </span>
                    </p>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-user-tie me-2"></i>Barber Details</h6>
                    <p><strong>Business:</strong> ${booking.business_name}</p>
                    <p><strong>Barber:</strong> ${booking.barber_name}</p>
                    <p><strong>Address:</strong> ${booking.address}</p>
                    ${booking.barber_phone ? `<p><strong>Phone:</strong> ${booking.barber_phone}</p>` : ''}
                    ${booking.barber_email ? `<p><strong>Email:</strong> ${booking.barber_email}</p>` : ''}
                </div>
            </div>
            ${booking.notes ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-sticky-note me-2"></i>Notes</h6>
                        <div class="alert alert-light">${booking.notes}</div>
                    </div>
                </div>
            ` : ''}
            <div class="row mt-3">
                <div class="col-12">
                    <p><strong>Booking ID:</strong> #${booking.id}</p>
                    <p><strong>Booked on:</strong> ${new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `;

        Auth.showModal('Booking Details', detailsHTML);
    }

    // Cancel booking
    static cancelBooking(bookingId) {
        MyBookings.bookingToCancel = bookingId;
        const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
        modal.show();
    }

    // Confirm cancellation
    static async confirmCancel() {
        if (!MyBookings.bookingToCancel) return;

        try {
            const confirmBtn = document.getElementById('confirmCancelBtn');
            const btnText = confirmBtn.querySelector('.btn-text');
            const loading = confirmBtn.querySelector('.loading');

            // Show loading state
            btnText.classList.add('d-none');
            loading.classList.remove('d-none');
            confirmBtn.disabled = true;

            const reason = document.getElementById('cancelReason').value.trim();

            const response = await Auth.makeRequest(`/bookings/${MyBookings.bookingToCancel}`, {
                method: 'DELETE',
                body: JSON.stringify({ reason })
            });

            if (response.success) {
                Auth.showAlert('Booking cancelled successfully', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
                modal.hide();
                
                // Reload bookings
                await MyBookings.loadBookings();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Cancel booking error:', error);
            Auth.showAlert(error.message || 'Failed to cancel booking. Please try again.', 'danger');
        } finally {
            // Reset button state
            const confirmBtn = document.getElementById('confirmCancelBtn');
            const btnText = confirmBtn.querySelector('.btn-text');
            const loading = confirmBtn.querySelector('.loading');
            
            btnText.classList.remove('d-none');
            loading.classList.add('d-none');
            confirmBtn.disabled = false;
        }
    }

    static addReview(bookingId) {
        Reviews.openReviewModal(bookingId);
    }

    // Utility methods
    static showLoading() {
        document.getElementById('loadingState').classList.remove('d-none');
        document.getElementById('bookingsList').classList.add('d-none');
        document.getElementById('emptyState').classList.add('d-none');
    }

    static hideLoading() {
        document.getElementById('loadingState').classList.add('d-none');
    }
}

// Make MyBookings available globally
window.MyBookings = MyBookings;
