USE cut_db;

-- Clear existing data
DELETE FROM reviews;
DELETE FROM bookings;
DELETE FROM barber_profiles;
DELETE FROM users;

-- Reset auto increment
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE barber_profiles AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;

-- Insert sample users with hashed passwords (password: "123456")
INSERT INTO users (name, email, password, phone, role, status) VALUES
-- Customers
('Ahmed Hassan', 'ahmed@example.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000001', 'customer', 'active'),
('Fatima El Idrissi', 'fatima@example.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000002', 'customer', 'active'),
('Youssef Benali', 'youssef@example.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000003', 'customer', 'active'),
('Sara Amrani', 'sara@example.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000004', 'customer', 'active'),
('Omar Tazi', 'omar@example.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000005', 'customer', 'active'),

-- Barbers
('Salon Elite - Rachid', 'rachid@salonelite.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000006', 'barber', 'active'),
('Barber Shop Hassan', 'hassan@barbershop.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000007', 'barber', 'active'),
('Coiffure Moderne - Karim', 'karim@moderne.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000008', 'barber', 'active'),
('Style Studio - Noureddine', 'noureddine@stylestudio.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000009', 'barber', 'active'),
('Premium Cuts - Amine', 'amine@premiumcuts.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000010', 'barber', 'active'),
('Classic Barber - Yassine', 'yassine@classicbarber.com', '$2b$10$eXQEz9AsZZsMRUKQqF6Oj.sEm6q5ivetvOhnuQELwBCrMXLMSYEfy', '+212600000011', 'barber', 'active');

-- Insert detailed barber profiles
INSERT INTO barber_profiles (user_id, business_name, description, address, city, neighborhood, latitude, longitude, services, working_hours, average_rating, total_reviews, is_verified) VALUES

(6, 'Salon Elite', 'Professional haircuts and styling for men and women. 15 years of experience in modern techniques and classic styles. We use premium products and maintain the highest hygiene standards.', 'Boulevard Hassan II, Near Twin Center', 'Casablanca', 'Centre Ville', 33.5731, -7.5898, 
'[
    {"name": "Men\'s Haircut", "price": 80, "duration": 30, "description": "Classic and modern cuts"},
    {"name": "Beard Trim", "price": 40, "duration": 15, "description": "Professional beard shaping"},
    {"name": "Hair Wash", "price": 25, "duration": 15, "description": "Premium shampoo and conditioning"},
    {"name": "Hot Towel Shave", "price": 60, "duration": 25, "description": "Traditional hot towel shave"},
    {"name": "Hair Styling", "price": 50, "duration": 20, "description": "Professional styling with premium products"}
]',
'{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "19:00"}, "saturday": {"open": "10:00", "close": "18:00"}, "sunday": {"closed": true}}',
4.5, 23, TRUE),

(7, 'Barber Shop Hassan', 'Traditional barber shop with modern techniques. Specializing in classic cuts, fades, and traditional shaving. Family-friendly environment with experienced staff.', 'Rue des FAR, Near McDonald\'s', 'Casablanca', 'Maarif', 33.5892, -7.6339, 
'[
    {"name": "Classic Cut", "price": 60, "duration": 25, "description": "Timeless classic haircuts"},
    {"name": "Fade Cut", "price": 70, "duration": 35, "description": "Modern fade techniques"},
    {"name": "Traditional Shave", "price": 35, "duration": 20, "description": "Classic razor shave"},
    {"name": "Mustache Trim", "price": 20, "duration": 10, "description": "Precision mustache grooming"},
    {"name": "Kids Cut", "price": 45, "duration": 20, "description": "Special service for children"}
]',
'{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "20:00"}, "saturday": {"open": "09:00", "close": "19:00"}, "sunday": {"open": "10:00", "close": "17:00"}}',
4.2, 18, TRUE),

(8, 'Coiffure Moderne', 'Modern styling and trendy cuts. Instagram-worthy results guaranteed! We stay updated with the latest fashion trends and use cutting-edge techniques.', 'Avenue Mohammed V, Gautier District', 'Casablanca', 'Gautier', 33.5764, -7.6176, 
'[
    {"name": "Trendy Cut", "price": 90, "duration": 40, "description": "Latest fashion-forward styles"},
    {"name": "Hair Styling", "price": 50, "duration": 25, "description": "Professional event styling"},
    {"name": "Hair Treatment", "price": 120, "duration": 60, "description": "Deep conditioning treatment"},
    {"name": "Beard Design", "price": 65, "duration": 30, "description": "Creative beard styling"},
    {"name": "Hair Coloring", "price": 200, "duration": 90, "description": "Professional color services"}
]',
'{"monday": {"open": "10:00", "close": "18:00"}, "tuesday": {"open": "10:00", "close": "18:00"}, "wednesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}, "friday": {"open": "10:00", "close": "18:00"}, "saturday": {"open": "11:00", "close": "19:00"}, "sunday": {"closed": true}}',
4.8, 31, TRUE),

(9, 'Style Studio', 'Contemporary hair studio specializing in creative cuts and premium grooming services. Our artists are trained in international techniques.', 'Rue Abou Baker Essedik, Racine', 'Casablanca', 'Racine', 33.5640, -7.6463, 
'[
    {"name": "Signature Cut", "price": 100, "duration": 45, "description": "Our signature premium service"},
    {"name": "Executive Grooming", "price": 85, "duration": 35, "description": "Complete grooming package"},
    {"name": "Scalp Treatment", "price": 80, "duration": 30, "description": "Therapeutic scalp care"},
    {"name": "Eyebrow Trimming", "price": 30, "duration": 15, "description": "Precision eyebrow grooming"}
]',
'{"monday": {"open": "09:30", "close": "19:30"}, "tuesday": {"open": "09:30", "close": "19:30"}, "wednesday": {"open": "09:30", "close": "19:30"}, "thursday": {"open": "09:30", "close": "19:30"}, "friday": {"open": "09:30", "close": "19:30"}, "saturday": {"open": "10:00", "close": "18:00"}, "sunday": {"open": "11:00", "close": "16:00"}}',
4.6, 27, TRUE),

(10, 'Premium Cuts', 'Luxury barber experience with VIP treatment. Premium products, comfortable environment, and exceptional service standards.', 'Boulevard Zerktouni, Near Hyatt Regency', 'Casablanca', 'Centre Ville', 33.5693, -7.6042, 
'[
    {"name": "VIP Package", "price": 150, "duration": 60, "description": "Complete luxury experience"},
    {"name": "Premium Cut", "price": 95, "duration": 40, "description": "High-end styling service"},
    {"name": "Royal Shave", "price": 75, "duration": 30, "description": "Luxury shaving experience"},
    {"name": "Grooming Consultation", "price": 50, "duration": 20, "description": "Personal styling advice"}
]',
'{"monday": {"open": "10:00", "close": "19:00"}, "tuesday": {"open": "10:00", "close": "19:00"}, "wednesday": {"open": "10:00", "close": "19:00"}, "thursday": {"open": "10:00", "close": "19:00"}, "friday": {"open": "10:00", "close": "19:00"}, "saturday": {"open": "11:00", "close": "18:00"}, "sunday": {"closed": true}}',
4.9, 41, TRUE),

(11, 'Classic Barber', 'Traditional barbershop atmosphere with old-school charm. Experienced barbers providing quality cuts at affordable prices.', 'Rue Prince Moulay Abdellah, Maârif', 'Casablanca', 'Maarif', 33.5856, -7.6281, 
'[
    {"name": "Basic Cut", "price": 50, "duration": 25, "description": "Simple, clean cuts"},
    {"name": "Standard Shave", "price": 30, "duration": 15, "description": "Traditional shave service"},
    {"name": "Wash & Cut", "price": 65, "duration": 35, "description": "Complete wash and cut service"},
    {"name": "Senior Discount", "price": 40, "duration": 25, "description": "Special pricing for seniors"}
]',
'{"monday": {"open": "08:30", "close": "19:30"}, "tuesday": {"open": "08:30", "close": "19:30"}, "wednesday": {"open": "08:30", "close": "19:30"}, "thursday": {"open": "08:30", "close": "19:30"}, "friday": {"open": "08:30", "close": "19:30"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "16:00"}}',
4.1, 15, TRUE);

-- Insert sample bookings
INSERT INTO bookings (customer_id, barber_id, service_name, service_price, service_duration, appointment_date, appointment_time, status, total_price, notes) VALUES
(1, 6, 'Men\'s Haircut', 80.00, 30, '2024-01-15', '10:00:00', 'completed', 80.00, 'Regular customer, preferred style'),
(2, 7, 'Fade Cut', 70.00, 35, '2024-01-16', '14:30:00', 'completed', 70.00, 'First time client'),
(3, 8, 'Trendy Cut', 90.00, 40, '2024-01-17', '11:00:00', 'completed', 90.00, 'Instagram photos requested'),
(4, 9, 'Signature Cut', 100.00, 45, '2024-01-18', '15:00:00', 'confirmed', 100.00, 'Business event preparation'),
(5, 10, 'VIP Package', 150.00, 60, '2024-01-19', '16:00:00', 'pending', 150.00, 'Special occasion'),
(1, 11, 'Basic Cut', 50.00, 25, '2024-01-20', '09:00:00', 'completed', 50.00, 'Quick trim needed'),
(2, 6, 'Beard Trim', 40.00, 15, '2024-01-21', '12:00:00', 'completed', 40.00, 'Regular maintenance'),
(3, 7, 'Traditional Shave', 35.00, 20, '2024-01-22', '13:30:00', 'completed', 35.00, 'Wedding preparation');

-- Insert sample reviews
INSERT INTO reviews (booking_id, customer_id, barber_id, rating, comment, quality_rating, service_rating, cleanliness_rating, is_verified) VALUES
(1, 1, 6, 5, 'Excellent service! Rachid is very professional and knows exactly what I want. The salon is clean and modern.', 5, 5, 5, TRUE),
(2, 2, 7, 4, 'Good haircut, Hassan is experienced. The place has a nice traditional feel. Will come back.', 4, 4, 4, TRUE),
(3, 3, 8, 5, 'Amazing trendy cut! Karim really understands modern styles. Perfect for my Instagram photos!', 5, 5, 4, TRUE),
(6, 1, 11, 4, 'Simple but good cut at a great price. No-frills service but gets the job done well.', 4, 4, 3, TRUE),
(7, 2, 6, 5, 'Love coming here for beard trims. Quick, professional, and always looks perfect.', 5, 5, 5, TRUE),
(8, 3, 7, 4, 'Traditional shave was relaxing and well done. Hassan has good technique with the razor.', 4, 4, 4, TRUE);

-- Update barber ratings based on reviews
UPDATE barber_profiles bp SET 
    average_rating = (
        SELECT AVG(r.rating) 
        FROM reviews r 
        WHERE r.barber_id = bp.user_id
    ),
    total_reviews = (
        SELECT COUNT(*) 
        FROM reviews r 
        WHERE r.barber_id = bp.user_id
    )
WHERE bp.user_id IN (6, 7, 8, 9, 10, 11);
