// Barbers utility class
class Barbers {
    static currentPage = 1;
    static currentFilters = {};
    static barbersData = [];
    
    // Load barbers with filters
    static async loadBarbers(filters = {}, page = 1) {
        try {
            // Show loading state
            Barbers.showLoading();
            
            // Build query parameters
            const params = new URLSearchParams({
                page: page,
                limit: 12,
                ...filters
            });
            
            // Remove empty filters
            for (const [key, value] of params.entries()) {
                if (!value) {
                    params.delete(key);
                }
            }
            
            console.log('Loading barbers with params:', params.toString());
            
            // Make API request
            const response = await fetch(`/api/barbers?${params}`);
            const data = await response.json();
            
            console.log('Barbers API response:', data);
            
            if (data.success) {
                Barbers.barbersData = data.data.barbers || [];
                Barbers.currentPage = page;
                Barbers.currentFilters = filters;
                
                // Display results
                Barbers.displayBarbers(data.data.barbers || []);
                Barbers.updateResultsHeader(data.data.barbers ? data.data.barbers.length : 0);
                
                // Update pagination if available
                if (data.data.pagination) {
                    Barbers.updatePagination(data.data.pagination);
                }
            } else {
                console.error('Barbers API error:', data.message);
                Barbers.showNoResults();
                Auth.showAlert(data.message || 'Failed to load barbers', 'danger');
            }
            
        } catch (error) {
            console.error('Load barbers error:', error);
            Barbers.showNoResults();
            Auth.showAlert('Failed to load barbers. Please try again.', 'danger');
        } finally {
            Barbers.hideLoading();
        }
    }
    
    // Display barbers in grid
    static displayBarbers(barbers) {
        const grid = document.getElementById('barbersGrid');
        const resultsHeader = document.getElementById('resultsHeader');
        const noResults = document.getElementById('noResults');
        
        console.log('Displaying barbers:', barbers);
        
        if (!barbers || barbers.length === 0) {
            grid.innerHTML = '';
            resultsHeader.classList.add('d-none');
            noResults.classList.remove('d-none');
            return;
        }
        
        resultsHeader.classList.remove('d-none');
        noResults.classList.add('d-none');
        
        grid.innerHTML = barbers.map(barber => Barbers.createBarberCard(barber)).join('');
    }
    
    // Create barber card HTML
    static createBarberCard(barber) {
        const services = Array.isArray(barber.services) ? barber.services.slice(0, 3) : [];
        const rating = parseFloat(barber.average_rating) || 0;
        const reviews = parseInt(barber.total_reviews) || 0;
        
        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 barber-card" onclick="Barbers.viewBarber(${barber.id})">
                    <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                        ${barber.avatar ? 
                            `<img src="${barber.avatar}" alt="${barber.business_name}" class="img-fluid rounded">` :
                            `<i class="fas fa-cut fa-3x text-primary"></i>`
                        }
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${barber.business_name || 'Barber Shop'}</h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-map-marker-alt"></i> 
                            ${barber.neighborhood ? `${barber.neighborhood}, ` : ''}${barber.city || 'Unknown City'}
                        </p>
                        
                        <div class="rating mb-2">
                            ${Barbers.generateStars(rating)}
                            <span class="ms-2">${rating.toFixed(1)} (${reviews} reviews)</span>
                        </div>
                        
                        <p class="card-text text-truncate" style="max-height: 3em;">
                            ${barber.description || 'Professional barber services'}
                        </p>
                        
                        <div class="services mb-3">
                            ${services.map(service => `
                                <span class="badge bg-light text-dark me-1 mb-1">
                                    ${service.name} - ${service.price} DH
                                </span>
                            `).join('')}
                            ${services.length > 3 ? `<span class="text-muted">+${services.length - 3} more</span>` : ''}
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary w-100" onclick="event.stopPropagation(); Barbers.bookNow(${barber.id})">
                            <i class="fas fa-calendar-check"></i> Book Now
                        </button>
                    </div>
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
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star text-warning"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt text-warning"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star text-warning"></i>';
        }
        
        return starsHTML;
    }
    
    // Update results header
    static updateResultsHeader(count) {
        const resultsCount = document.getElementById('resultsCount');
        resultsCount.textContent = `${count} barber${count !== 1 ? 's' : ''} found`;
    }
    
    // Update pagination
    static updatePagination(pagination) {
        const paginationNav = document.getElementById('pagination');
        const paginationList = paginationNav.querySelector('.pagination');
        
        if (pagination.total <= pagination.limit) {
            paginationNav.classList.add('d-none');
            return;
        }
        
        paginationNav.classList.remove('d-none');
        
        const totalPages = Math.ceil(pagination.total / pagination.limit);
        const currentPage = pagination.page;
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="Barbers.goToPage(${currentPage - 1})">Previous</a>
            </li>
        `;
        
        // Page numbers
        for (let page = 1; page <= totalPages; page++) {
            if (page === currentPage) {
                paginationHTML += `
                    <li class="page-item active">
                        <a class="page-link" href="#">${page}</a>
                    </li>
                `;
            } else if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) {
                paginationHTML += `
                    <li class="page-item">
                        <a class="page-link" href="#" onclick="Barbers.goToPage(${page})">${page}</a>
                    </li>
                `;
            } else if (Math.abs(page - currentPage) === 3) {
                paginationHTML += `
                    <li class="page-item disabled">
                        <a class="page-link" href="#">...</a>
                    </li>
                `;
            }
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="Barbers.goToPage(${currentPage + 1})">Next</a>
            </li>
        `;
        
        paginationList.innerHTML = paginationHTML;
    }
    
    // Go to specific page
    static goToPage(page) {
        if (page < 1) return;
        Barbers.loadBarbers(Barbers.currentFilters, page);
    }
    
    // Setup event listeners
    static setupEventListeners() {
        // Search form
        const searchForm = document.getElementById('searchForm');
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            Barbers.performSearch();
        });
        
        // Use location button
        const useLocationBtn = document.getElementById('useLocationBtn');
        useLocationBtn.addEventListener('click', Barbers.useLocation);
        
        // Real-time search (debounced)
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Barbers.performSearch();
            }, 500);
        });
        
        // Filter changes
        const filters = ['cityFilter', 'sortBy'];
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            element.addEventListener('change', Barbers.performSearch);
        });
    }
    
    // Perform search
    static performSearch() {
        const filters = {
            search: document.getElementById('searchInput').value.trim(),
            city: document.getElementById('cityFilter').value,
            sort_by: document.getElementById('sortBy').value,
            order: 'desc'
        };
        
        Barbers.loadBarbers(filters, 1);
    }
    
    // Use geolocation for nearby barbers
    static useLocation() {
        if (!navigator.geolocation) {
            Auth.showAlert('Geolocation is not supported by this browser.', 'warning');
            return;
        }
        
        const btn = document.getElementById('useLocationBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
        btn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    
                    const response = await fetch(`/api/barbers/search/location?latitude=${latitude}&longitude=${longitude}&radius=10`);
                    const data = await response.json();
                    
                    if (data.success) {
                        Barbers.barbersData = data.data.barbers;
                        Barbers.displayBarbers(data.data.barbers);
                        Barbers.updateResultsHeader(data.data.barbers.length);
                        Auth.showAlert(`Found ${data.data.barbers.length} barbers within 10km`, 'success');
                    } else {
                        throw new Error(data.message);
                    }
                } catch (error) {
                    console.error('Location search error:', error);
                    Auth.showAlert('Failed to search nearby barbers.', 'danger');
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                Auth.showAlert('Unable to access your location.', 'warning');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        );
    }
    
    // View barber details
    static viewBarber(barberId) {
        window.location.href = `barber-profile.html?id=${barberId}`;
    }
    
    // Book appointment
    static bookNow(barberId) {
        if (!Auth.isLoggedIn()) {
            Auth.showAlert('Please login to book an appointment.', 'warning');
            window.location.href = 'login.html';
            return;
        }
        
        window.location.href = `booking.html?barber=${barberId}`;
    }
    
    // Show loading state
    static showLoading() {
        document.getElementById('loadingState').classList.remove('d-none');
        document.getElementById('barbersGrid').innerHTML = '';
        document.getElementById('resultsHeader').classList.add('d-none');
        document.getElementById('noResults').classList.add('d-none');
        document.getElementById('pagination').classList.add('d-none');
    }
    
    // Hide loading state
    static hideLoading() {
        document.getElementById('loadingState').classList.add('d-none');
    }
    
    // Show no results state
    static showNoResults() {
        document.getElementById('barbersGrid').innerHTML = '';
        document.getElementById('resultsHeader').classList.add('d-none');
        document.getElementById('noResults').classList.remove('d-none');
        document.getElementById('pagination').classList.add('d-none');
    }
}

// Make Barbers available globally
window.Barbers = Barbers;
