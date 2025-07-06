const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cutuser',
    password: process.env.DB_PASSWORD || 'yourpassword',
    database: process.env.DB_NAME || 'cut_db',
    charset: 'utf8mb4'
};

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(dbConfig);
            console.log('✅ Database connected successfully');
            return this.connection;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            process.exit(1);
        }
    }

    async query(sql, params = []) {
        try {
            const [results] = await this.connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = new Database();
