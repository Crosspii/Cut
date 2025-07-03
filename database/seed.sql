USE cut_db;

-- Insert sample users
INSERT INTO users (name, email, password, phone, role) VALUES
-- Customers
('Ahmed Hassan', 'ahmed@example.com', '$2b$10$example.hash.here', '+212600000001', 'customer'),
('Fatima El Idrissi', 'fatima@example.com', '$2b$10$example.hash.here', '+212600000002', 'customer'),
('Youssef Benali', 'youssef@example.com', '$2b$10$example.hash.here', '+212600000003', 'customer'),

-- Barbers
('Salon Elite - Rachid', 'rachid@salonelite.com', '$2b$10$example.hash.here', '+212600000004', 'barber'),
('Barber Shop Hassan', 'hassan@barbershop.com', '$2b$10$example.hash.here', '+212600000005', 'barber'),
('Coiffure Moderne - Karim', 'karim@moderne.com', '$2b$10$example.hash.here', '+212600000006', 'barber');

-- Insert barber profiles
INSERT INTO barber_profiles (user_id, business_name, description, address, city, neighborhood, services, working_hours, average_rating, total_reviews, is_verified) VALUES
(4, 'Salon Elite', 'Professional haircuts and styling for men and women. 15 years of experience.', 'Boulevard Hassan II, Casablanca', 'Casablanca', 'Centre Ville', 
'[{"name": "Men\'s Haircut", "price": 80, "duration": 30}, {"name": "Beard Trim", "price": 40, "duration": 15}, {"name": "Hair Wash", "price": 25, "duration": 15}]',
'{"monday": {"open": "09:00", "close": "19:00"}, "tuesday": {"open": "09:00", "close": "19:00"}, "wednesday": {"open": "09:00", "close": "19:00"}, "thursday": {"open": "09:00", "close": "19:00"}, "friday": {"open": "09:00", "close": "19:00"}, "saturday": {"open": "10:00", "close": "18:00"}, "sunday": {"closed": true}}',
4.5, 23, TRUE),

(5, 'Barber Shop Hassan', 'Traditional barber shop with modern techniques. Specializing in classic cuts.', 'Rue des FAR, Casablanca', 'Casablanca', 'Maarif', 
'[{"name": "Classic Cut", "price": 60, "duration": 25}, {"name": "Fade Cut", "price": 70, "duration": 35}, {"name": "Shave", "price": 35, "duration": 20}]',
'{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}, "wednesday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "08:00", "close": "20:00"}, "friday": {"open": "08:00", "close": "20:00"}, "saturday": {"open": "09:00", "close": "19:00"}, "sunday": {"open": "10:00", "close": "17:00"}}',
4.2, 18, TRUE),

(6, 'Coiffure Moderne', 'Modern styling and trendy cuts. Instagram-worthy results guaranteed!', 'Avenue Mohammed V, Casablanca', 'Casablanca', 'Gautier', 
'[{"name": "Trendy Cut", "price": 90, "duration": 40}, {"name": "Styling", "price": 50, "duration": 25}, {"name": "Hair Treatment", "price": 120, "duration": 60}]',
'{"monday": {"open": "10:00", "close": "18:00"}, "tuesday": {"open": "10:00", "close": "18:00"}, "wednesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}, "friday": {"open": "10:00", "close": "18:00"}, "saturday": {"open": "11:00", "close": "19:00"}, "sunday": {"closed": true}}',
4.8, 31, TRUE);
