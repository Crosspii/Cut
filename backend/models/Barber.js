const db = require('../config/database');

class Barber {
    constructor(barberData) {
        this.user_id = barberData.user_id;
        this.business_name = barberData.business_name;
        this.description = barberData.description;
        this.address = barberData.address;
        this.city = barberData.city;
        this.neighborhood = barberData.neighborhood;
        this.latitude = barberData.latitude;
        this.longitude = barberData.longitude;
        this.phone = barberData.phone;
        this.services = barberData.services;
        this.working_hours = barberData.working_hours;
        this.is_active = barberData.is_active !== undefined ? barberData.is_active : true;
    }

    // Helper method for safe JSON parsing
    static parseJsonField(jsonString, defaultValue = null) {
        try {
            if (!jsonString || jsonString === null || jsonString === 'null') {
                return defaultValue;
            }
            if (typeof jsonString === 'object') {
                return jsonString; // Already parsed
            }
            if (typeof jsonString === 'string') {
                return JSON.parse(jsonString);
            }
            return defaultValue;
        } catch (e) {
            console.log('JSON parse error:', e.message, 'Data:', jsonString);
            return defaultValue;
        }
    }

    // Helper method to process barber data
    static processBarberData(barber) {
        if (!barber) return null;
        
        barber.services = Barber.parseJsonField(barber.services, []);
        barber.working_hours = Barber.parseJsonField(barber.working_hours, {});
        
        return barber;
    }

    // Create barber profile
    async save() {
        try {
            const query = `
                INSERT INTO barber_profiles 
                (user_id, business_name, description, address, city, neighborhood, 
                 latitude, longitude, phone, services, working_hours, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await db.query(query, [
                this.user_id,
                this.business_name,
                this.description,
                this.address,
                this.city,
                this.neighborhood,
                this.latitude,
                this.longitude,
                this.phone,
                JSON.stringify(this.services),
                JSON.stringify(this.working_hours),
                this.is_active
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find barber profile by user ID - FIXED
    static async findByUserId(userId) {
        try {
            const query = `
                SELECT bp.*, u.name, u.email, u.avatar 
                FROM barber_profiles bp
                JOIN users u ON bp.user_id = u.id
                WHERE bp.user_id = ?
            `;
            const barbers = await db.query(query, [userId]);
            
            if (barbers.length > 0) {
                return Barber.processBarberData(barbers[0]);
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    // Find barber profile by ID - FIXED
    static async findById(id) {
        try {
            const query = `
                SELECT bp.*, u.name, u.email, u.avatar 
                FROM barber_profiles bp
                JOIN users u ON bp.user_id = u.id
                WHERE bp.id = ?
            `;
            const barbers = await db.query(query, [id]);
            
            if (barbers.length > 0) {
                return Barber.processBarberData(barbers[0]);
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    // Get all active barbers with filters - FIXED
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT bp.*, u.name, u.email, u.avatar 
                FROM barber_profiles bp
                JOIN users u ON bp.user_id = u.id
                WHERE bp.is_active = true AND u.status = 'active'
            `;
            const queryParams = [];

            // Add city filter
            if (filters.city) {
                query += ` AND bp.city = ?`;
                queryParams.push(filters.city);
            }

            // Add neighborhood filter
            if (filters.neighborhood) {
                query += ` AND bp.neighborhood = ?`;
                queryParams.push(filters.neighborhood);
            }

            // Add search filter
            if (filters.search) {
                query += ` AND (bp.business_name LIKE ? OR u.name LIKE ? OR bp.description LIKE ?)`;
                const searchTerm = `%${filters.search}%`;
                queryParams.push(searchTerm, searchTerm, searchTerm);
            }

            // Add rating filter
            if (filters.min_rating) {
                query += ` AND bp.average_rating >= ?`;
                queryParams.push(parseFloat(filters.min_rating));
            }

            // Add ordering
            const allowedSortFields = ['average_rating', 'total_reviews', 'business_name', 'created_at'];
            const sortBy = allowedSortFields.includes(filters.sort_by) ? filters.sort_by : 'average_rating';
            const orderDirection = filters.order === 'asc' ? 'ASC' : 'DESC';
            query += ` ORDER BY bp.${sortBy} ${orderDirection}`;

            // Add pagination
            const limit = parseInt(filters.limit) || 20;
            const page = parseInt(filters.page) || 1;
            const offset = (page - 1) * limit;
            
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            const barbers = await db.query(query, queryParams);
            
            // Process each barber with safe JSON parsing
            return barbers.map(barber => Barber.processBarberData(barber));
        } catch (error) {
            console.error('Barber.findAll error:', error);
            throw error;
        }
    }

    // Update barber profile
    static async update(userId, updateData) {
        try {
            const fields = [];
            const values = [];
            
            // Handle regular fields
            const allowedFields = [
                'business_name', 'description', 'address', 'city', 'neighborhood',
                'latitude', 'longitude', 'phone', 'is_active'
            ];
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            });
            
            // Handle JSON fields
            if (updateData.services !== undefined) {
                fields.push('services = ?');
                values.push(JSON.stringify(updateData.services));
            }
            
            if (updateData.working_hours !== undefined) {
                fields.push('working_hours = ?');
                values.push(JSON.stringify(updateData.working_hours));
            }
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            values.push(userId);
            const query = `UPDATE barber_profiles SET ${fields.join(', ')} WHERE user_id = ?`;
            await db.query(query, values);
            
            return await Barber.findByUserId(userId);
        } catch (error) {
            throw error;
        }
    }

    // Update rating after new review
    static async updateRating(barberId) {
        try {
            const ratingQuery = `
                SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
                FROM reviews 
                WHERE barber_id = ?
            `;
            const ratingData = await db.query(ratingQuery, [barberId]);
            
            if (ratingData.length > 0) {
                const avgRating = parseFloat(ratingData[0].avg_rating) || 0;
                const totalReviews = parseInt(ratingData[0].total_reviews) || 0;
                
                const updateQuery = `
                    UPDATE barber_profiles 
                    SET average_rating = ?, total_reviews = ?
                    WHERE user_id = ?
                `;
                await db.query(updateQuery, [avgRating, totalReviews, barberId]);
            }
        } catch (error) {
            throw error;
        }
    }

    // Get barber availability for a specific date - FIXED
    static async getAvailability(barberId, date) {
        try {
            // Try to find by user_id first, then by profile id
            let barber = await Barber.findByUserId(barberId);
            
            if (!barber) {
                // If not found by user_id, try by profile id
                barber = await Barber.findById(barberId);
            }
            
            if (!barber) {
                throw new Error('Barber not found');
            }

            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const workingHours = barber.working_hours[dayOfWeek];
            
            if (!workingHours || workingHours.closed) {
                return { available: false, slots: [] };
            }

            // Get existing bookings for the date - use user_id for barber_id
            const bookingsQuery = `
                SELECT appointment_time, service_duration 
                FROM bookings 
                WHERE barber_id = ? AND appointment_date = ? 
                AND status NOT IN ('cancelled', 'no_show')
            `;
            const bookings = await db.query(bookingsQuery, [barber.user_id, date]);

            // Generate available time slots
            const slots = Barber.generateTimeSlots(workingHours, bookings);
            
            return { available: slots.length > 0, slots };
        } catch (error) {
            throw error;
        }
    }

    // Generate available time slots
    static generateTimeSlots(workingHours, existingBookings) {
        const slots = [];
        const slotDuration = 30; // 30 minutes per slot
        
        const startTime = Barber.timeToMinutes(workingHours.open);
        const endTime = Barber.timeToMinutes(workingHours.close);
        
        // Convert existing bookings to occupied time ranges
        const occupiedRanges = existingBookings.map(booking => {
            const start = Barber.timeToMinutes(booking.appointment_time);
            const duration = booking.service_duration || 30;
            return { start, end: start + duration };
        });
        
        // Generate slots
        for (let time = startTime; time < endTime; time += slotDuration) {
            const slotEnd = time + slotDuration;
            
            // Check if slot conflicts with existing bookings
            const isOccupied = occupiedRanges.some(range => 
                (time >= range.start && time < range.end) ||
                (slotEnd > range.start && slotEnd <= range.end) ||
                (time <= range.start && slotEnd >= range.end)
            );
            
            if (!isOccupied) {
                slots.push(Barber.minutesToTime(time));
            }
        }
        
        return slots;
    }

    // Helper: Convert time string to minutes
    static timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Helper: Convert minutes to time string
    static minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // Search barbers by location - FIXED
    static async searchByLocation(latitude, longitude, radius = 10) {
        try {
            // Use Haversine formula to find nearby barbers
            const query = `
                SELECT bp.*, u.name, u.email, u.avatar,
                       (6371 * acos(cos(radians(?)) * cos(radians(bp.latitude)) * 
                       cos(radians(bp.longitude) - radians(?)) + 
                       sin(radians(?)) * sin(radians(bp.latitude)))) AS distance
                FROM barber_profiles bp
                JOIN users u ON bp.user_id = u.id
                WHERE bp.is_active = true 
                AND u.status = 'active'
                AND bp.latitude IS NOT NULL 
                AND bp.longitude IS NOT NULL
                HAVING distance <= ?
                ORDER BY distance
            `;

            const barbers = await db.query(query, [latitude, longitude, latitude, radius]);
            
            // Process each barber with safe JSON parsing
            return barbers.map(barber => Barber.processBarberData(barber));
        } catch (error) {
            console.error('Barber.searchByLocation error:', error);
            throw error;
        }
    }
}

module.exports = Barber;
