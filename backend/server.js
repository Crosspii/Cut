const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Basic route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Cut API is working!' });
});

// serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.listen(PORT, () => {
    console.log(`Cut server running on port ${PORT}`);
});

module.exports = app;
