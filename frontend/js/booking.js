// Booking system class
class Booking {
    static currentStep = 1;
    static selectedBarber = null;
    static selectedService = null;
    static selectedDate = null;
    static selectedTime = null;
    static availableSlots = [];
    static bookingData = {};

    // Initialize booking system
    static init() {
        // Get barber ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const barberId = urlParams.get('barber');

        if (!barberId) {
            Auth.showAlert('No barber selected. Redirecting to barber listing...', 'warning');
            setTimeout(() => {
                window.location.href = 'barbers.html';
            }, 2000);
            return;
        }

        // Load barber information
        Booking.loadBarberInfo(barberId);
    }

    // Load barber information
    static async loadBarberInfo(barberId) {
        try {
            Booking.showLoading();

            const response = await fetch(`/api/barbers/${barberId}`);
            const data = await response.json();

            if (data.success) {
                Booking.selectedBarber = data.data;
                Booking.displayBarberInfo();
                Booking.showStep(1);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Load barber info error:', error);
            Auth.showAlert('Failed to load barber information. Please try again.', 'danger');
            setTimeout(() => {
                window.location.href = 'barbers.html';
            }, 2000);
        } finally {
            Booking.hideLoading();
        }
    }

    // Display barber information
    static displayBarberInfo() {
        const barberInfo = document.getElementById('barberInfo');
        const barber = Booking.selectedBarber;

        barberInfo.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="text-center">
                        ${barber.avatar ? 
                            `<img src="${barber.avatar}" alt="${barber.business_name}" class="img-fluid rounded-circle mb-3" style="width: 100px; height: 100px; object-fit: cover;">` :
                            `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center mb-3 mx-auto" style="width: 100px; height: 100px;">
                                <i class="fas fa-cut fa-2x text-white"></i>
                            </div>`
                        }
                    </div>
                </div>
                <div class="col-md-9">
                    <h5>${barber.business_name}</h5>
                    <p class="text-muted mb-2">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${barber.address}, ${barber.neighborhood ? `${barber.neighborhood}, ` : ''}${barber.city}
                    </p>
                    <div class="rating mb-2">
                        ${Booking.generateStars(barber.average_rating || 0)}
                        <span class="ms-2">${(barber.average_rating || 0).toFixed(1)} (${barber.total_reviews || 0} reviews)</span>
                    </div>
                    ${barber.description ? `<p class="mb-2">${barber.description}</p>` : ''}
                    ${barber.phone ? `<p class="mb-0"><i class="fas fa-phone"></i> ${barber.phone}</p>` : ''}
                </div>
            </div>
        `;
    }

    // Generate star rating HTML
    static generateStars(rating) {
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

    // Display services
    static displayServices() {
        const servicesList = document.getElementById('servicesList');
        const services = Booking.selectedBarber.services || [];

        if (services.length === 0) {
            servicesList.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-4">
                        <i class="fas fa-cut fa-3x text-muted mb-3"></i>
                        <h5>No services available</h5>
                        <p class="text-muted">This barber hasn't added any services yet.</p>
                    </div>
                </div>
            `;
            return;
        }

        servicesList.innerHTML = services.map((service, index) => `
            <div class="col-md-6 mb-3">
                <div class="card service-card h-100" onclick="Booking.selectService(${index})">
                    <div class="card-body">
                        <h5 class="card-title">${service.name}</h5>
                        <p class="card-text">${service.description || 'Professional service'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="h5 text-primary mb-0">${service.price} DH</span>
                            <span class="badge bg-light text-dark">
                                <i class="fas fa-clock"></i> ${service.duration} min
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Select service
    static selectService(serviceIndex) {
        // Remove previous selection
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new service
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards[serviceIndex].classList.add('selected');

        Booking.selectedService = Booking.selectedBarber.services[serviceIndex];

        // Enable next button
        const nextBtn = document.getElementById('serviceNextBtn');
        nextBtn.disabled = false;
    }

    // Display calendar
    static displayCalendar() {
        const calendar = document.getElementById('calendar');
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Calculate dates for next 30 days
        const dates = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }

        // Group dates by week
        const weeks = [];
        let currentWeek = [];
        
        dates.forEach((date, index) => {
            currentWeek.push(date);
            if (currentWeek.length === 7 || index === dates.length - 1) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }
        });

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        calendar.innerHTML = `
            <div class="calendar-header mb-3">
                <h6 class="text-center">${monthNames[currentMonth]} ${currentYear}</h6>
            </div>
            <div class="calendar-grid">
                <div class="row g-1 mb-2">
                    <div class="col text-center"><small class="text-muted">Sun</small></div>
                    <div class="col text-center"><small class="text-muted">Mon</small></div>
                    <div class="col text-center"><small class="text-muted">Tue</small></div>
                    <div class="col text-center"><small class="text-muted">Wed</small></div>
                    <div class="col text-center"><small class="text-muted">Thu</small></div>
                    <div class="col text-center"><small class="text-muted">Fri</small></div>
                    <div class="col text-center"><small class="text-muted">Sat</small></div>
                </div>
                ${weeks.map(week => `
                    <div class="row g-1 mb-1">
                        ${Array.from({length: 7}, (_, i) => {
                            const date = week[i];
                            if (!date) return '<div class="col"></div>';
                            
                            const dateStr = date.toISOString().split('T')[0];
                            const isToday = date.toDateString() === today.toDateString();
                            const isPast = date < today;
                            
                            return `
                                <div class="col">
                                    <div class="calendar-day ${isToday ? 'today' : ''} ${isPast ? 'disabled' : ''}" 
                                         data-date="${dateStr}" 
                                         onclick="${!isPast ? `Booking.selectDate('${dateStr}')` : ''}">
                                        ${date.getDate()}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Select date and load time slots
    static async selectDate(dateStr) {
        try {
            // Remove previous selection
            document.querySelectorAll('.calendar-day').forEach(day => {
                day.classList.remove('selected');
            });

            // Select new date
            const selectedDay = document.querySelector(`[data-date="${dateStr}"]`);
            selectedDay.classList.add('selected');

            Booking.selectedDate = dateStr;

            // Update selected date display
            const selectedDate = new Date(dateStr);
            const dateDisplay = document.getElementById('selectedDateDisplay');
            dateDisplay.textContent = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Load available time slots
            await Booking.loadTimeSlots(dateStr);

        } catch (error) {
            console.error('Select date error:', error);
            Auth.showAlert('Failed to load time slots. Please try again.', 'danger');
        }
    }

    // Load available time slots
    static async loadTimeSlots(date) {
        try {
            const timeSlotsContainer = document.getElementById('timeSlots');
            timeSlotsContainer.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <p class="mt-2 mb-0">Loading available times...</p>
                </div>
            `;

            const response = await fetch(`/api/barbers/${Booking.selectedBarber.user_id}/availability?date=${date}`);
            const data = await response.json();

            if (data.success) {
                Booking.availableSlots = data.data.slots || [];
                Booking.displayTimeSlots();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Load time slots error:', error);
            const timeSlotsContainer = document.getElementById('timeSlots');
            timeSlotsContainer.innerHTML = `
                <div class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>Failed to load available times</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="Booking.loadTimeSlots('${date}')">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    // Display time slots
    static displayTimeSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        const slots = Booking.availableSlots;

        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                    <h6>No available times</h6>
                    <p class="text-muted">Please select another date</p>
                </div>
            `;
            return;
        }

        timeSlotsContainer.innerHTML = `
            <div class="row g-2">
                ${slots.map(time => `
                    <div class="col-6 col-md-4">
                        <div class="time-slot text-center py-2 rounded" 
                             data-time="${time}" 
                             onclick="Booking.selectTime('${time}')">
                            ${Booking.formatTime(time)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Format time display
    static formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }

    // Select time
    static selectTime(time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });

        // Select new time
        const selectedSlot = document.querySelector(`[data-time="${time}"]`);
        selectedSlot.classList.add('selected');

        Booking.selectedTime = time;

        // Enable next button
        const nextBtn = document.getElementById('dateTimeNextBtn');
        nextBtn.disabled = false;
    }

    // Display booking summary
    static displayBookingSummary() {
        const summaryContainer = document.getElementById('bookingSummary');
        const barber = Booking.selectedBarber;
        const service = Booking.selectedService;
        const date = new Date(Booking.selectedDate);
        const time = Booking.selectedTime;

        summaryContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-user-tie me-2"></i>Barber</h6>
                    <div class="d-flex align-items-center mb-3">
                        ${barber.avatar ? 
                            `<img src="${barber.avatar}" alt="${barber.business_name}" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">` :
                            `<div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                                <i class="fas fa-cut text-white"></i>
                            </div>`
                        }
                        <div>
                            <strong>${barber.business_name}</strong><br>
                            <small class="text-muted">${barber.address}, ${barber.city}</small>
                        </div>
                    </div>

                    <h6><i class="fas fa-cut me-2"></i>Service</h6>
                    <div class="mb-3">
                        <strong>${service.name}</strong><br>
                        <small class="text-muted">${service.description || 'Professional service'}</small><br>
                        <small class="text-muted">Duration: ${service.duration} minutes</small>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-calendar me-2"></i>Date & Time</h6>
                    <div class="mb-3">
                        <strong>${date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</strong><br>
                        <strong>${Booking.formatTime(time)}</strong>
                    </div>

                    <h6><i class="fas fa-money-bill me-2"></i>Total Price</h6>
                    <div class="mb-3">
                        <span class="h4 text-primary">${service.price} DH</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Confirm booking
    static async confirmBooking() {
        try {
            const confirmBtn = document.getElementById('confirmBookingBtn');
            const btnText = confirmBtn.querySelector('.btn-text');
            const loading = confirmBtn.querySelector('.loading');

            // Show loading state
            btnText.classList.add('d-none');
            loading.classList.remove('d-none');
            confirmBtn.disabled = true;

            // Prepare booking data
            const bookingData = {
                barber_id: Booking.selectedBarber.user_id,
                service_name: Booking.selectedService.name,
                service_price: Booking.selectedService.price,
                service_duration: Booking.selectedService.duration,
                appointment_date: Booking.selectedDate,
                appointment_time: Booking.selectedTime,
                notes: document.getElementById('bookingNotes').value.trim()
            };

            // Submit booking
            const response = await Auth.makeRequest('/bookings', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });

            if (response.success) {
                Booking.bookingData = response.data;
                Booking.showSuccessState();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Confirm booking error:', error);
            Auth.showAlert(error.message || 'Failed to create booking. Please try again.', 'danger');

            // Reset button state
            const confirmBtn = document.getElementById('confirmBookingBtn');
            const btnText = confirmBtn.querySelector('.btn-text');
            const loading = confirmBtn.querySelector('.loading');
            
            btnText.classList.remove('d-none');
            loading.classList.add('d-none');
            confirmBtn.disabled = false;
        }
    }

    // Show success state
    static showSuccessState() {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.add('d-none');
        });

        // Show success state
        const successState = document.getElementById('successState');
        successState.classList.remove('d-none');

        // Display confirmation details
        const confirmationDetails = document.getElementById('bookingConfirmationDetails');
        const booking = Booking.bookingData;
        const date = new Date(booking.appointment_date);

        confirmationDetails.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Booking ID</h6>
                            <p><strong>#${booking.id}</strong></p>
                            
                            <h6>Barber</h6>
                            <p>${booking.business_name}</p>
                            
                            <h6>Service</h6>
                            <p>${booking.service_name} (${booking.service_duration} min)</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Date & Time</h6>
                            <p>${date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} at ${Booking.formatTime(booking.appointment_time)}</p>
                            
                            <h6>Total Price</h6>
                            <p><strong>${booking.total_price} DH</strong></p>
                            
                            <h6>Status</h6>
                            <span class="badge bg-warning">Pending Confirmation</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Navigation methods
    static nextStep() {
        if (Booking.currentStep === 1) {
            Booking.displayServices();
        } else if (Booking.currentStep === 2) {
            Booking.displayCalendar();
        } else if (Booking.currentStep === 3) {
            Booking.displayBookingSummary();
        }

        Booking.currentStep++;
        Booking.updateSteps();
        Booking.showStep(Booking.currentStep);
    }

    static prevStep() {
        Booking.currentStep--;
        Booking.updateSteps();
        Booking.showStep(Booking.currentStep);
    }

    static showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.add('d-none');
        });

        // Show current step
        const stepNames = ['', 'barberStep', 'serviceStep', 'dateTimeStep', 'confirmationStep'];
        const currentStepElement = document.getElementById(stepNames[stepNumber]);
        if (currentStepElement) {
            currentStepElement.classList.remove('d-none');
        }
    }

    static updateSteps() {
        // Update step indicators
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step${i}`);
            step.classList.remove('active', 'completed');
            
            if (i < Booking.currentStep) {
                step.classList.add('completed');
            } else if (i === Booking.currentStep) {
                step.classList.add('active');
            }
        }
    }

    // Utility methods
    static showLoading() {
        document.getElementById('loadingState').classList.remove('d-none');
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.add('d-none');
        });
    }

    static hideLoading() {
        document.getElementById('loadingState').classList.add('d-none');
    }
}

// Make Booking available globally
window.Booking = Booking;
