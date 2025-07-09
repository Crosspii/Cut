const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initializing database connection
db.connect();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/barbers', require('./routes/barbers'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));


// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Cut API is working!', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve specific HTML pages
app.get('/barbers.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/barbers.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/register.html'));
});

app.get('/barber-profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/barber-profile.html'));
});

app.get('/booking.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/booking.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

app.get('/barber-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/barber-dashboard.html'));
});

app.get('/my-bookings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/my-bookings.html'));
});

// Handle 404 for API routes
app.use('/api/', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Serve index.html for root and any other non-API routes
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error.stack);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors
        });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry error'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Cut server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/test`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await db.close();
    process.exit(0);
});

module.exports = app;
