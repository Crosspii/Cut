-- create the db
CREATE DATABASE IF NOT EXISTS cut_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cut_db;

-- Users table creating
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'barber') DEFAULT 'customer',
    avatar VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);


-- Barber profiles
CREATE TABLE barber_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(100),
    description TEXT,
    address TEXT,
    city VARCHAR(50),
    neighborhood VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),

    -- Services JSON
    services JSON,

    -- Working hours JSON
    working_hours JSON,

    -- Ratings JSON
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_city (city),
    INDEX idx_neighborhood (neighborhood),
    INDEX idx_rating (average_rating),
    INDEX idx_active (is_active)
);

-- Bookings
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    barber_id INT NOT NULL,

    -- Service details
    service_name VARCHAR(100) NOT NULL,
    service_price DECIMAL(8, 2) NOT NULL,
    service_duration INT DEFAULT 30,

    -- appointment details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,

    -- Status
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',

    -- extra info
    notes TEXT,
    cancellation_reason TEXT,
    total_price DECIMAL(8, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_customer_id (customer_id),
    INDEX idx_barber_id (barber_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_datetime (appointment_date, appointment_time)
);

-- Reviews
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    barber_id INT NOT NULL,

    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    -- additional rating categories
    quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
    service_rating INT CHECK (service_rating >= 1 AND service_rating <= 5),
    cleanliness_rating INT CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),

    is_verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_booking_review (booking_id),
    INDEX idx_barber_id (barber_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
);

-- Chat messages (in the future)
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'system') DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_booking_id (booking_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_created_at (created_at)
);
