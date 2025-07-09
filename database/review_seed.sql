-- Add this to your database
DROP TABLE reviews;


CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    barber_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking_review (booking_id)
);

-- Add sample reviews for demo
INSERT INTO reviews (booking_id, customer_id, barber_id, rating, comment) VALUES
(1, 1, 6, 5, 'Excellent service! Ahmed really knows his craft. The haircut was perfect and the atmosphere was very professional.'),
(2, 2, 7, 4, 'Great haircut, very satisfied with the result. Rachid is skilled and friendly. Will definitely come back!'),
(3, 3, 8, 5, 'Outstanding experience! Youssef exceeded my expectations. The beard trim was exactly what I wanted.'),
(4, 4, 9, 4, 'Good service overall. Omar is professional and the salon is clean. Minor wait time but worth it.'),
(5, 5, 10, 5, 'Perfect! Khalid is an artist with scissors. Best haircut I\'ve had in years. Highly recommended!');
