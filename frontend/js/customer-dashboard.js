// Customer Dashboard class
class CustomerDashboard {
    static stats = {};
    static upcomingAppointments = [];
    static favoriteBarbers = [];
    static recentActivity = [];

    // Initialize dashboard
    static init() {
        const user = Auth.getCurrentUser();
        console.log('Customer dashboard init - User:', user);
        console.log('Is logged in:', Auth.isLoggedIn());
        console.log('Token:', Auth.getToken());
        
        if (user) {
            document.getElementById('welcomeMessage').textContent = 
                `Welcome back, ${user.name}! Here's your appointment overview.`;
        }

        CustomerDashboard.loadDashboardData();
    }

    // Load all dashboard data
    static async loadDashboardData() {
        try {
            await Promise.all([
                CustomerDashboard.loadStats(),
                CustomerDashboard.loadUpcomingAppointments(),
                CustomerDashboard.loadFavoriteBarbers(),
                CustomerDashboard.loadRecentActivity(),
                CustomerDashboard.loadReviewStats()
            ]);
        } catch (error) {
            console.error('Load dashboard error:', error);
            Auth.showAlert('Failed to load dashboard data. Please refresh the page.', 'danger');
        }
    }

    // Load statistics
    static async loadStats() {
        try {
            console.log('Loading dashboard stats...');
            const response = await Auth.makeRequest('/bookings/statistics?days=30');
            
            console.log('Stats response:', response);
            
            if (response.success) {
                CustomerDashboard.stats = response.data;
                CustomerDashboard.displayStats();
            } else {
                console.error('Stats API error:', response.message);
                CustomerDashboard.displayEmptyStats();
            }
        } catch (error) {
            console.error('Load stats error:', error);
            console.error('Error details:', error.message, error.stack);
            CustomerDashboard.displayEmptyStats();
        }
    }

    // Display statistics cards
    static displayStats() {
        const statsCards = document.getElementById('statsCards');
        const stats = CustomerDashboard.stats;

        statsCards.innerHTML = `
            <div class="col-md-3 mb-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-calendar-check fa-2x mb-3"></i>
                        <h3>${stats.total_bookings || 0}</h3>
                        <h6 class="card-title">Total Bookings</h6>
                        <small>Last 30 days</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card bookings">
                    <div class="card-body text-center">
                        <i class="fas fa-clock fa-2x mb-3"></i>
                        <h3>${stats.pending_bookings || 0}</h3>
                        <h6 class="card-title">Pending</h6>
                        <small>Awaiting confirmation</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card completed">
                    <div class="card-body text-center">
                        <i class="fas fa-check-circle fa-2x mb-3"></i>
                        <h3>${stats.completed_bookings || 0}</h3>
                        <h6 class="card-title">Completed</h6>
                        <small>Successful visits</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card spent">
                    <div class="card-body text-center">
                        <i class="fas fa-money-bill-wave fa-2x mb-3"></i>
                        <h3>${Math.round(stats.total_revenue || 0)} DH</h3>
                        <h6 class="card-title">Total Spent</h6>
                        <small>Last 30 days</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Display empty stats (for new users)
    static displayEmptyStats() {
        const statsCards = document.getElementById('statsCards');
        
        statsCards.innerHTML = `
            <div class="col-md-3 mb-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-calendar-check fa-2x mb-3"></i>
                        <h3>0</h3>
                        <h6 class="card-title">Total Bookings</h6>
                        <small>Start booking today!</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card bookings">
                    <div class="card-body text-center">
                        <i class="fas fa-clock fa-2x mb-3"></i>
                        <h3>0</h3>
                        <h6 class="card-title">Pending</h6>
                        <small>No pending bookings</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card completed">
                    <div class="card-body text-center">
                        <i class="fas fa-check-circle fa-2x mb-3"></i>
                        <h3>0</h3>
                        <h6 class="card-title">Completed</h6>
                        <small>Book your first visit</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card stats-card spent">
                    <div class="card-body text-center">
                        <i class="fas fa-money-bill-wave fa-2x mb-3"></i>
                        <h3>0 DH</h3>
                        <h6 class="card-title">Total Spent</h6>
                        <small>Start your journey</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Load upcoming appointments
    static async loadUpcomingAppointments() {
        try {
            console.log('Loading upcoming appointments...');
            const response = await Auth.makeRequest('/bookings/upcoming?days=7');
            
            console.log('Upcoming appointments response:', response);
            
            if (response.success) {
                CustomerDashboard.upcomingAppointments = response.data || [];
                CustomerDashboard.displayUpcomingAppointments();
            } else {
                console.error('Upcoming appointments API error:', response.message);
                CustomerDashboard.displayEmptyUpcoming();
            }
        } catch (error) {
            console.error('Load upcoming error:', error);
            console.error('Error details:', error.message, error.stack);
            CustomerDashboard.displayEmptyUpcoming();
        }
    }

    // Display upcoming appointments
    static displayUpcomingAppointments() {
        const container = document.getElementById('upcomingAppointments');
        const appointments = CustomerDashboard.upcomingAppointments;

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-calendar-plus fa-3x mb-3"></i>
                    <h6>No upcoming appointments</h6>
                    <p>Ready to book your next visit?</p>
                    <a href="barbers.html" class="btn btn-primary">Find a Barber</a>
                </div>
            `;
            return;
        }

        // Sort by date and time
        const sortedAppointments = [...appointments].sort((a, b) => {
            const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
            return dateA - dateB;
        });

        container.innerHTML = sortedAppointments.map(appointment => 
            CustomerDashboard.createAppointmentPreview(appointment)
        ).join('');
    }

    // Display empty upcoming appointments
    static displayEmptyUpcoming() {
        const container = document.getElementById('upcomingAppointments');
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-calendar-plus fa-3x mb-3"></i>
                <h6>No upcoming appointments</h6>
                <p>Ready to book your next visit?</p>
                <a href="barbers.html" class="btn btn-primary">Find a Barber</a>
            </div>
        `;
    }

    // Create appointment preview card
    static createAppointmentPreview(appointment) {
        const appointmentDate = new Date(appointment.appointment_date);
        const time = CustomerDashboard.formatTime(appointment.appointment_time);
        const isToday = appointmentDate.toDateString() === new Date().toDateString();
        const isTomorrow = appointmentDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

        let dateDisplay;
        if (isToday) {
            dateDisplay = 'Today';
        } else if (isTomorrow) {
            dateDisplay = 'Tomorrow';
        } else {
            dateDisplay = appointmentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }

        return `
            <div class="card appointment-preview ${appointment.status} mb-3">
                <div class="card-body py-3">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center">
                            <div class="fw-bold text-primary">${dateDisplay}</div>
                            <div class="h6 mb-0">${time}</div>
                        </div>
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                ${appointment.barber_avatar ? 
                                    `<img src="${appointment.barber_avatar}" alt="${appointment.business_name}" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">` :
                                    `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                                        <i class="fas fa-cut text-white"></i>
                                    </div>`
                                }
                                <div>
                                    <div class="fw-bold">${appointment.business_name}</div>
                                    <small class="text-muted">${appointment.barber_name}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="fw-bold">${appointment.service_name}</div>
                            <small class="text-muted">${appointment.service_duration} min • ${appointment.service_price} DH</small>
                        </div>
                        <div class="col-md-2 text-center">
                            <span class="badge ${CustomerDashboard.getStatusClass(appointment.status)}">
                                ${CustomerDashboard.getStatusText(appointment.status)}
                            </span>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-outline-primary btn-sm" onclick="CustomerDashboard.viewAppointment(${appointment.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Load favorite barbers (based on booking history)
    static async loadFavoriteBarbers() {
        try {
            console.log('Loading favorite barbers...');
            // For now, we'll show recent barbers as "favorites"
            const response = await Auth.makeRequest('/bookings/my-bookings?limit=5&status=completed');
            
            console.log('Favorites response:', response);
            
            if (response.success) {
                const recentBookings = response.data.bookings || [];
                
                // Get unique barbers
                const uniqueBarbers = recentBookings.reduce((acc, booking) => {
                    if (!acc.find(b => b.barber_id === booking.barber_id)) {
                        acc.push({
                            barber_id: booking.barber_id,
                            business_name: booking.business_name,
                            barber_name: booking.barber_name,
                            barber_avatar: booking.barber_avatar,
                            last_visit: booking.appointment_date
                        });
                    }
                    return acc;
                }, []);

                CustomerDashboard.favoriteBarbers = uniqueBarbers;
                CustomerDashboard.displayFavoriteBarbers();
            } else {
                console.error('Favorites API error:', response.message);
                CustomerDashboard.displayEmptyFavorites();
            }
        } catch (error) {
            console.error('Load favorites error:', error);
            console.error('Error details:', error.message, error.stack);
            CustomerDashboard.displayEmptyFavorites();
        }
    }

    // Display favorite barbers
    static displayFavoriteBarbers() {
        const container = document.getElementById('favoriteBarbers');
        const favorites = CustomerDashboard.favoriteBarbers;

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-heart fa-2x mb-3"></i>
                    <p>No favorite barbers yet</p>
                    <small>Book appointments to see your favorites here</small>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map(barber => `
            <div class="d-flex align-items-center mb-3">
                ${barber.barber_avatar ? 
                    `<img src="${barber.barber_avatar}" alt="${barber.business_name}" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">` :
                    `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="fas fa-cut text-white"></i>
                    </div>`
                }
                <div class="flex-grow-1">
                    <div class="fw-bold">${barber.business_name}</div>
                    <small class="text-muted">Last visit: ${new Date(barber.last_visit).toLocaleDateString()}</small>
                </div>
                <button class="btn btn-outline-primary btn-sm" onclick="CustomerDashboard.bookWithBarber(${barber.barber_id})">
                    <i class="fas fa-calendar-plus"></i>
                </button>
            </div>
        `).join('');
    }

    // Display empty favorites
    static displayEmptyFavorites() {
        const container = document.getElementById('favoriteBarbers');
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-heart fa-2x mb-3"></i>
                <p>No favorite barbers yet</p>
                <small>Book appointments to see your favorites here</small>
            </div>
        `;
    }

    // Load recent activity
    static async loadRecentActivity() {
        try {
            console.log('Loading recent activity...');
            const response = await Auth.makeRequest('/bookings/my-bookings?limit=5');
            
            console.log('Recent activity response:', response);
            
            if (response.success) {
                const recentBookings = response.data.bookings || [];
                CustomerDashboard.recentActivity = recentBookings;
                CustomerDashboard.displayRecentActivity();
            } else {
                console.error('Recent activity API error:', response.message);
                CustomerDashboard.displayEmptyActivity();
            }
        } catch (error) {
            console.error('Load activity error:', error);
            console.error('Error details:', error.message, error.stack);
            CustomerDashboard.displayEmptyActivity();
        }
    }

    // Display recent activity
    static displayRecentActivity() {
        const container = document.getElementById('recentActivity');
        const activities = CustomerDashboard.recentActivity;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-history fa-3x mb-3"></i>
                    <h6>No recent activity</h6>
                    <p>Your booking history will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => {
            const activityDate = new Date(activity.created_at);
            const appointmentDate = new Date(activity.appointment_date);
            
            return `
                <div class="d-flex align-items-start mb-3 pb-3 border-bottom">
                    <div class="me-3">
                        <div class="bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                            <i class="fas ${CustomerDashboard.getActivityIcon(activity.status)} text-primary"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${CustomerDashboard.getActivityText(activity)}</div>
                        <div class="text-muted">${activity.business_name}</div>
                        <small class="text-muted">
                            ${activityDate.toLocaleDateString()} • 
                            Appointment: ${appointmentDate.toLocaleDateString()}
                        </small>
                    </div>
                    <span class="badge ${CustomerDashboard.getStatusClass(activity.status)}">
                        ${CustomerDashboard.getStatusText(activity.status)}
                    </span>
                </div>
            `;
        }).join('');
    }

    // Display empty activity
    static displayEmptyActivity() {
        const container = document.getElementById('recentActivity');
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-history fa-3x mb-3"></i>
                <h6>No recent activity</h6>
                <p>Your booking history will appear here</p>
            </div>
        `;
    }

    // Get activity icon based on status
    static getActivityIcon(status) {
        const icons = {
            pending: 'fa-clock',
            confirmed: 'fa-check',
            completed: 'fa-check-circle',
            cancelled: 'fa-times-circle',
            no_show: 'fa-user-times'
        };
        return icons[status] || 'fa-calendar';
    }

    // Get activity text based on booking
    static getActivityText(booking) {
        const texts = {
            pending: 'Booked appointment',
            confirmed: 'Appointment confirmed',
            completed: 'Completed appointment',
            cancelled: 'Cancelled appointment',
            no_show: 'Missed appointment'
        };
        return texts[booking.status] || 'Booking activity';
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

        // Load customer's review statistics
    static async loadReviewStats() {
        try {
            console.log('Loading review stats...');
            const response = await Auth.makeRequest('/reviews/my-reviews');
            
            console.log('Review stats response:', response);
            
            if (response.success) {
                const reviews = response.data.reviews || [];
                CustomerDashboard.displayReviewStats(reviews);
            } else {
                console.error('Review stats API error:', response.message);
                // Don't show anything for reviews if there are none
            }
        } catch (error) {
            console.error('Load review stats error:', error);
            console.error('Error details:', error.message, error.stack);
            // Don't show anything for reviews if there are none
        }
    }

    // Display review statistics
    static displayReviewStats(reviews) {
        if (reviews.length === 0) return;

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        // Add review stats to the dashboard
        const quickActionsSection = document.querySelector('.quick-actions').closest('section');
        
        const reviewStatsHTML = `
            <section class="py-4">
                <div class="container">
                    <div class="card dashboard-card">
                        <div class="card-header">
                            <h5><i class="fas fa-star me-2 text-warning"></i>Your Reviews</h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-md-3">
                                    <div class="h4 text-warning">${reviews.length}</div>
                                    <small class="text-muted">Reviews Written</small>
                                </div>
                                <div class="col-md-3">
                                    <div class="h4 text-primary">${avgRating.toFixed(1)}</div>
                                    <small class="text-muted">Average Rating Given</small>
                                </div>
                                <div class="col-md-6">
                                    <button class="btn btn-outline-primary" onclick="CustomerDashboard.viewMyReviews()">
                                        <i class="fas fa-eye me-2"></i>View All My Reviews
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        
        quickActionsSection.insertAdjacentHTML('afterend', reviewStatsHTML);
    }

    // View customer's reviews
    static viewMyReviews() {
        // For now, just show an alert. You can enhance this later
        Auth.showAlert('Your reviews feature - coming in the next update!', 'info');
    }

    // View appointment details
    static viewAppointment(appointmentId) {
        window.location.href = `my-bookings.html#appointment-${appointmentId}`;
    }

    // Quick action methods
    static findBarbers() {
        window.location.href = 'barbers.html';
    }

    static viewBookings() {
        window.location.href = 'my-bookings.html';
    }

    static bookNow() {
        window.location.href = 'barbers.html';
    }

    static viewProfile() {
        Auth.showAlert('Profile editing feature coming soon!', 'info');
    }

    static bookWithBarber(barberId) {
        window.location.href = `booking.html?barber=${barberId}`;
    }

    // Refresh dashboard data
    static async refreshData() {
        try {
            console.log('Refreshing customer dashboard data...');
            await CustomerDashboard.loadDashboardData();
            console.log('Dashboard refresh completed successfully');
            Auth.showAlert('Dashboard refreshed successfully', 'success');
        } catch (error) {
            console.error('Dashboard refresh error:', error);
            Auth.showAlert('Failed to refresh data', 'danger');
        }
    }

    // Force refresh recent activity only
    static async refreshRecentActivity() {
        try {
            console.log('Refreshing recent activity...');
            await CustomerDashboard.loadRecentActivity();
            console.log('Recent activity refresh completed');
        } catch (error) {
            console.error('Recent activity refresh error:', error);
        }
    }
}

// Make CustomerDashboard available globally
window.CustomerDashboard = CustomerDashboard;
