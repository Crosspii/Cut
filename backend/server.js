const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection
db.connect();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/barbers', require('./routes/barbers'));

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
        // Test database connection
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

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error.stack);
    
    // Handle specific error types
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

// Handle 404 for API routes
app.use('/api/', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Cut server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api/test`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
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
