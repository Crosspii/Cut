const db = require('../config/database');

class Booking {
    constructor(bookingData) {
        this.customer_id = bookingData.customer_id;
        this.barber_id = bookingData.barber_id;
        this.service_name = bookingData.service_name;
        this.service_price = bookingData.service_price;
        this.service_duration = bookingData.service_duration;
        this.appointment_date = bookingData.appointment_date;
        this.appointment_time = bookingData.appointment_time;
        this.status = bookingData.status || 'pending';
        this.total_price = bookingData.total_price;
        this.notes = bookingData.notes || null;
        this.created_at = bookingData.created_at || new Date();
    }

    // Create new booking
    async save() {
        try {
            const query = `
                INSERT INTO bookings 
                (customer_id, barber_id, service_name, service_price, service_duration,
                 appointment_date, appointment_time, status, total_price, notes, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await db.query(query, [
                this.customer_id,
                this.barber_id,
                this.service_name,
                this.service_price,
                this.service_duration,
                this.appointment_date,
                this.appointment_time,
                this.status,
                this.total_price,
                this.notes,
                this.created_at
            ]);
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find booking by ID with full details
    static async findById(id) {
        try {
            const query = `
                SELECT b.*, 
                       c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
                       bp.business_name, bp.address, bp.phone as barber_phone,
                       u.name as barber_name, u.email as barber_email
                FROM bookings b
                JOIN users c ON b.customer_id = c.id
                JOIN users u ON b.barber_id = u.id
                JOIN barber_profiles bp ON b.barber_id = bp.user_id
                WHERE b.id = ?
            `;
            
            const bookings = await db.query(query, [id]);
            return bookings.length > 0 ? bookings[0] : null;
        } catch (error) {
            throw error;
        }
    }

    // Get customer's bookings
    static async findByCustomerId(customerId, filters = {}) {
        try {
            let query = `
                SELECT b.*, 
                       bp.business_name, bp.address, bp.phone as barber_phone,
                       u.name as barber_name, u.email as barber_email, u.avatar as barber_avatar
                FROM bookings b
                JOIN users u ON b.barber_id = u.id
                JOIN barber_profiles bp ON b.barber_id = bp.user_id
                WHERE b.customer_id = ?
            `;
            const queryParams = [customerId];

            // Add status filter
            if (filters.status) {
                query += ` AND b.status = ?`;
                queryParams.push(filters.status);
            }

            // Add date range filter
            if (filters.from_date) {
                query += ` AND b.appointment_date >= ?`;
                queryParams.push(filters.from_date);
            }

            if (filters.to_date) {
                query += ` AND b.appointment_date <= ?`;
                queryParams.push(filters.to_date);
            }

            // Order by appointment date and time
            query += ` ORDER BY b.appointment_date ASC, b.appointment_time ASC`;

            // Add pagination
            const limit = parseInt(filters.limit) || 50;
            const page = parseInt(filters.page) || 1;
            const offset = (page - 1) * limit;
            
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            return await db.query(query, queryParams);
        } catch (error) {
            throw error;
        }
    }

    // Get barber's bookings
    static async findByBarberId(barberId, filters = {}) {
        try {
            let query = `
                SELECT b.*, 
                       c.name as customer_name, c.email as customer_email, 
                       c.phone as customer_phone, c.avatar as customer_avatar
                FROM bookings b
                JOIN users c ON b.customer_id = c.id
                WHERE b.barber_id = ?
            `;
            const queryParams = [barberId];

            // Add status filter
            if (filters.status) {
                query += ` AND b.status = ?`;
                queryParams.push(filters.status);
            }

            // Add date range filter
            if (filters.from_date) {
                query += ` AND b.appointment_date >= ?`;
                queryParams.push(filters.from_date);
            }

            if (filters.to_date) {
                query += ` AND b.appointment_date <= ?`;
                queryParams.push(filters.to_date);
            }

            // Order by appointment date and time
            query += ` ORDER BY b.appointment_date ASC, b.appointment_time ASC`;

            // Add pagination
            const limit = parseInt(filters.limit) || 50;
            const page = parseInt(filters.page) || 1;
            const offset = (page - 1) * limit;
            
            query += ` LIMIT ${limit} OFFSET ${offset}`;

            return await db.query(query, queryParams);
        } catch (error) {
            throw error;
        }
    }

    // Update booking status
    static async updateStatus(id, status, updatedBy = null) {
        try {
            const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
            if (!allowedStatuses.includes(status)) {
                throw new Error('Invalid status');
            }

            const query = `
                UPDATE bookings 
                SET status = ?, updated_at = NOW()
                WHERE id = ?
            `;
            
            await db.query(query, [status, id]);
            return await Booking.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Check for booking conflicts
    static async checkConflicts(barberId, date, time, duration, excludeBookingId = null) {
        try {
            let query = `
                SELECT id, appointment_time, service_duration 
                FROM bookings 
                WHERE barber_id = ? 
                AND appointment_date = ? 
                AND status NOT IN ('cancelled', 'no_show')
            `;
            const queryParams = [barberId, date];

            // Exclude current booking when updating
            if (excludeBookingId) {
                query += ` AND id != ?`;
                queryParams.push(excludeBookingId);
            }

            const existingBookings = await db.query(query, queryParams);
            
            // Convert time and duration to minutes for conflict checking
            const newStartMinutes = Booking.timeToMinutes(time);
            const newEndMinutes = newStartMinutes + parseInt(duration);

            for (const booking of existingBookings) {
                const existingStartMinutes = Booking.timeToMinutes(booking.appointment_time);
                const existingEndMinutes = existingStartMinutes + (booking.service_duration || 30);

                // Check if times overlap
                if (
                    (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
                    (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
                    (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
                ) {
                    return {
                        hasConflict: true,
                        conflictingBooking: booking
                    };
                }
            }

            return { hasConflict: false };
        } catch (error) {
            throw error;
        }
    }

    // Get booking statistics for dashboard
    static async getStatistics(barberId = null, customerId = null, dateRange = 30) {
        try {
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - dateRange);
            
            let whereClause = 'WHERE b.appointment_date >= ?';
            let queryParams = [fromDate.toISOString().split('T')[0]];

            if (barberId) {
                whereClause += ' AND b.barber_id = ?';
                queryParams.push(barberId);
            }

            if (customerId) {
                whereClause += ' AND b.customer_id = ?';
                queryParams.push(customerId);
            }

            const query = `
                SELECT 
                    COUNT(*) as total_bookings,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                    SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'completed' THEN total_price ELSE NULL END) as avg_booking_value
                FROM bookings b
                ${whereClause}
            `;

            const stats = await db.query(query, queryParams);
            return stats[0];
        } catch (error) {
            throw error;
        }
    }

    // Get upcoming appointments
    static async getUpcoming(barberId = null, customerId = null, days = 7) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            let query = `
                SELECT b.*, 
                       c.name as customer_name, c.phone as customer_phone,
                       bp.business_name, u.name as barber_name
                FROM bookings b
                JOIN users c ON b.customer_id = c.id
                JOIN users u ON b.barber_id = u.id
                JOIN barber_profiles bp ON b.barber_id = bp.user_id
                WHERE b.appointment_date BETWEEN ? AND ?
                AND b.status IN ('pending', 'confirmed')
            `;
            const queryParams = [today, futureDateStr];

            if (barberId) {
                query += ' AND b.barber_id = ?';
                queryParams.push(barberId);
            }

            if (customerId) {
                query += ' AND b.customer_id = ?';
                queryParams.push(customerId);
            }

            query += ' ORDER BY b.appointment_date ASC, b.appointment_time ASC';

            return await db.query(query, queryParams);
        } catch (error) {
            throw error;
        }
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

    // Validate booking data
    static validateBookingData(data) {
        const errors = [];

        if (!data.customer_id) errors.push('Customer ID is required');
        if (!data.barber_id) errors.push('Barber ID is required');
        if (!data.service_name) errors.push('Service name is required');
        if (!data.service_price || data.service_price <= 0) errors.push('Valid service price is required');
        if (!data.service_duration || data.service_duration <= 0) errors.push('Valid service duration is required');
        if (!data.appointment_date) errors.push('Appointment date is required');
        if (!data.appointment_time) errors.push('Appointment time is required');

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (data.appointment_date && !dateRegex.test(data.appointment_date)) {
            errors.push('Invalid date format. Use YYYY-MM-DD');
        }

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (data.appointment_time && !timeRegex.test(data.appointment_time)) {
            errors.push('Invalid time format. Use HH:MM');
        }

        // Check if date is not in the past
        if (data.appointment_date) {
            const appointmentDate = new Date(data.appointment_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (appointmentDate < today) {
                errors.push('Cannot book appointments for past dates');
            }
        }

        return errors;
    }
}

module.exports = Booking;
