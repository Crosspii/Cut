// Barber Dashboard class
class BarberDashboard {
    static stats = {};
    static todayAppointments = [];
    static upcomingAppointments = [];
    static appointmentToUpdate = null;

    // Initialize dashboard
    static init() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('welcomeMessage').textContent = 
                `Welcome back, ${user.name}! Here's your business overview.`;
        }

        BarberDashboard.loadDashboardData();
    }

    // Load all dashboard data
    static async loadDashboardData() {
        try {
            await Promise.all([
                BarberDashboard.loadStats(),
                BarberDashboard.loadTodayAppointments(),
                BarberDashboard.loadUpcoming()
            ]);
        } catch (error) {
            console.error('Load dashboard error:', error);
            Auth.showAlert('Failed to load dashboard data. Please refresh the page.', 'danger');
        }
    }

    // Load statistics
    static async loadStats() {
        try {
            const response = await Auth.makeRequest('/bookings/statistics?days=30');
            
            if (response.success) {
                BarberDashboard.stats = response.data;
                BarberDashboard.displayStats();
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    // Display statistics cards
    static displayStats() {
        const statsCards = document.getElementById('statsCards');
        const stats = BarberDashboard.stats;

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
                <div class="card stats-card revenue">
                    <div class="card-body text-center">
                        <i class="fas fa-money-bill-wave fa-2x mb-3"></i>
                        <h3>${Math.round(stats.total_revenue || 0)} DH</h3>
                        <h6 class="card-title">Total Revenue</h6>
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
                <div class="card stats-card rating">
                    <div class="card-body text-center">
                        <i class="fas fa-star fa-2x mb-3"></i>
                        <h3>${Math.round(stats.avg_booking_value || 0)} DH</h3>
                        <h6 class="card-title">Avg. Booking</h6>
                        <small>Per appointment</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Load today's appointments
    static async loadTodayAppointments() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await Auth.makeRequest(`/bookings/my-bookings?from_date=${today}&to_date=${today}`);
            
            if (response.success) {
                BarberDashboard.todayAppointments = response.data.bookings || [];
                BarberDashboard.displayTodayAppointments();
            }
        } catch (error) {
            console.error('Load today appointments error:', error);
        }
    }

    // Display today's appointments
    static displayTodayAppointments() {
        const container = document.getElementById('todayAppointments');
        const countBadge = document.getElementById('todayCount');
        const appointments = BarberDashboard.todayAppointments;

        countBadge.textContent = appointments.length;

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-calendar-day fa-3x mb-3"></i>
                    <h6>No appointments today</h6>
                    <p>Enjoy your free day!</p>
                </div>
            `;
            return;
        }

        // Sort by time
        const sortedAppointments = [...appointments].sort((a, b) => 
            a.appointment_time.localeCompare(b.appointment_time)
        );

        container.innerHTML = sortedAppointments.map(appointment => 
            BarberDashboard.createAppointmentCard(appointment, true)
        ).join('');
    }

    // Load upcoming appointments
    static async loadUpcoming() {
        try {
            const response = await Auth.makeRequest('/bookings/upcoming?days=7');
            
            if (response.success) {
                BarberDashboard.upcomingAppointments = response.data || [];
                BarberDashboard.displayUpcomingAppointments();
            }
        } catch (error) {
            console.error('Load upcoming error:', error);
        }
    }

    // Display upcoming appointments
    static displayUpcomingAppointments() {
        const container = document.getElementById('upcomingAppointments');
        const appointments = BarberDashboard.upcomingAppointments;

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-calendar-week fa-3x mb-3"></i>
                    <h6>No upcoming appointments</h6>
                    <p>Your schedule is clear for the next 7 days.</p>
                </div>
            `;
            return;
        }

        // Group by date
        const groupedAppointments = BarberDashboard.groupAppointmentsByDate(appointments);
        
        container.innerHTML = Object.entries(groupedAppointments).map(([date, dayAppointments]) => {
            const dateObj = new Date(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return `
                <div class="mb-4">
                    <h6 class="text-primary mb-3">
                        <i class="fas fa-calendar me-2"></i>
                        ${isToday ? 'Today - ' : ''}${dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                        <span class="badge bg-light text-dark ms-2">${dayAppointments.length} appointments</span>
                    </h6>
                    ${dayAppointments.map(appointment => 
                        BarberDashboard.createAppointmentCard(appointment, false)
                    ).join('')}
                </div>
            `;
        }).join('');
    }

    // Group appointments by date
    static groupAppointmentsByDate(appointments) {
        return appointments.reduce((groups, appointment) => {
            const date = appointment.appointment_date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(appointment);
            return groups;
        }, {});
    }

    // Create appointment card
    static createAppointmentCard(appointment, isToday = false) {
        const time = BarberDashboard.formatTime(appointment.appointment_time);
        const canUpdate = ['pending', 'confirmed'].includes(appointment.status);

        return `
            <div class="card appointment-card ${appointment.status} mb-2">
                <div class="card-body py-3">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center">
                            <div class="h5 text-primary mb-0">${time}</div>
                            <small class="text-muted">${appointment.service_duration} min</small>
                        </div>
                        <div class="col-md-3">
                            <div class="fw-bold">${appointment.customer_name}</div>
                            <small class="text-muted">
                                <i class="fas fa-phone me-1"></i>${appointment.customer_phone || 'No phone'}
                            </small>
                        </div>
                        <div class="col-md-3">
                            <div class="fw-bold">${appointment.service_name}</div>
                            <small class="text-primary">${appointment.service_price} DH</small>
                        </div>
                        <div class="col-md-2 text-center">
                            <span class="badge ${BarberDashboard.getStatusClass(appointment.status)}">
                                ${BarberDashboard.getStatusText(appointment.status)}
                            </span>
                        </div>
                        <div class="col-md-2 text-end">
                            ${canUpdate ? `
                                <button class="btn btn-outline-primary btn-sm" onclick="BarberDashboard.updateStatus(${appointment.id})">
                                    <i class="fas fa-edit"></i> Update
                                </button>
                            ` : `
                                <button class="btn btn-outline-secondary btn-sm" onclick="BarberDashboard.viewAppointment(${appointment.id})">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
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

    // Update appointment status
    static updateStatus(appointmentId) {
        const appointment = [...BarberDashboard.todayAppointments, ...BarberDashboard.upcomingAppointments]
            .find(a => a.id === appointmentId);
        
        if (!appointment) return;

        BarberDashboard.appointmentToUpdate = appointmentId;
        
        // Display appointment details
        const details = document.getElementById('appointmentDetails');
        const appointmentDate = new Date(appointment.appointment_date);
        
        details.innerHTML = `
            <div class="alert alert-light">
                <strong>Customer:</strong> ${appointment.customer_name}<br>
                <strong>Service:</strong> ${appointment.service_name}<br>
                <strong>Date:</strong> ${appointmentDate.toLocaleDateString()}<br>
                <strong>Time:</strong> ${BarberDashboard.formatTime(appointment.appointment_time)}<br>
                <strong>Current Status:</strong> 
                <span class="badge ${BarberDashboard.getStatusClass(appointment.status)}">
                    ${BarberDashboard.getStatusText(appointment.status)}
                </span>
            </div>
        `;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('statusModal'));
        modal.show();
    }

    // Confirm status update
    static async confirmStatusUpdate() {
        if (!BarberDashboard.appointmentToUpdate) return;

        try {
            const newStatus = document.getElementById('newStatus').value;
            if (!newStatus) {
                Auth.showAlert('Please select a status', 'warning');
                return;
            }

            const confirmBtn = document.getElementById('updateStatusBtn');
            const btnText = confirmBtn.querySelector('.btn-text');
            const loading = confirmBtn.querySelector('.loading');

            // Show loading state
            btnText.classList.add('d-none');
            loading.classList.remove('d-none');
            confirmBtn.disabled = true;

            const response = await Auth.makeRequest(`/bookings/${BarberDashboard.appointmentToUpdate}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.success) {
                Auth.showAlert('Appointment status updated successfully', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('statusModal'));
                modal.hide();
                
                // Refresh data
                await BarberDashboard.refreshData();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Update status error:', error);
            Auth.showAlert(error.message || 'Failed to update status. Please try again.', 'danger');
        } finally {
            // Reset button state
            const confirmBtn = document.getElementById('updateStatusBtn');
            const btnText = confirmBtn.querySelector('.btn-text');
            const loading = confirmBtn.querySelector('.loading');
            
            btnText.classList.remove('d-none');
            loading.classList.add('d-none');
            confirmBtn.disabled = false;
        }
    }

    // View appointment details
    static viewAppointment(appointmentId) {
        const appointment = [...BarberDashboard.todayAppointments, ...BarberDashboard.upcomingAppointments]
            .find(a => a.id === appointmentId);
        
        if (!appointment) return;

        const appointmentDate = new Date(appointment.appointment_date);
        
        const detailsHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-user me-2"></i>Customer Information</h6>
                    <p><strong>Name:</strong> ${appointment.customer_name}</p>
                    <p><strong>Phone:</strong> ${appointment.customer_phone || 'Not provided'}</p>
                    <p><strong>Email:</strong> ${appointment.customer_email || 'Not provided'}</p>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-calendar me-2"></i>Appointment Details</h6>
                    <p><strong>Date:</strong> ${appointmentDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                    <p><strong>Time:</strong> ${BarberDashboard.formatTime(appointment.appointment_time)}</p>
                    <p><strong>Service:</strong> ${appointment.service_name}</p>
                    <p><strong>Duration:</strong> ${appointment.service_duration} minutes</p>
                    <p><strong>Price:</strong> ${appointment.service_price} DH</p>
                    <p><strong>Status:</strong> 
                        <span class="badge ${BarberDashboard.getStatusClass(appointment.status)}">
                            ${BarberDashboard.getStatusText(appointment.status)}
                        </span>
                    </p>
                </div>
            </div>
            ${appointment.notes ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-sticky-note me-2"></i>Customer Notes</h6>
                        <div class="alert alert-light">${appointment.notes}</div>
                    </div>
                </div>
            ` : ''}
        `;

        Auth.showModal('Appointment Details', detailsHTML);
    }

    // Refresh all data
    static async refreshData() {
        try {
            await BarberDashboard.loadDashboardData();
            Auth.showAlert('Dashboard refreshed successfully', 'success');
        } catch (error) {
            Auth.showAlert('Failed to refresh data', 'danger');
        }
    }

    // Quick action methods
    static viewAllBookings() {
        window.open('my-bookings.html', '_blank');
    }

    static viewUpcoming() {
        BarberDashboard.loadUpcoming();
    }

    static viewPending() {
        // Filter and show only pending appointments
        const pendingAppointments = BarberDashboard.upcomingAppointments.filter(a => a.status === 'pending');
        
        if (pendingAppointments.length === 0) {
            Auth.showAlert('No pending appointments found', 'info');
            return;
        }

        const pendingHTML = pendingAppointments.map(appointment => 
            BarberDashboard.createAppointmentCard(appointment, false)
        ).join('');

        Auth.showModal('Pending Appointments', `
            <div class="mb-3">
                <p>You have ${pendingAppointments.length} pending appointment(s) that need confirmation:</p>
            </div>
            ${pendingHTML}
        `);
    }

    static viewReports() {
        Auth.showAlert('Reports feature coming soon!', 'info');
    }
}

// Making BarberDashboard available globally
window.BarberDashboard = BarberDashboard;
