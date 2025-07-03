require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || '3f0b58003f67f4aa3b17f3883e343e199b08f95e7fc293da8a6f944bf34f3d7f',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',

    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'cut_db',

    // File Uploads
    UPLOAD_PATH: './public/uploads',
    MAX_FILE_SIZE: 1024 * 1024 * 5,

    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development'
};
