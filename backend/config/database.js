const mysql = require('mysql2/promise');
const mockDatabase = require('./mockDatabase');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cut_db',
    charset: 'utf8mb4'
};

class Database {
    constructor() {
        this.connection = null;
        this.useMock = false;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(dbConfig);
            console.log('✅ Database connected successfully');
            return this.connection;
        } catch (error) {
            console.warn('❌ MySQL connection failed, using mock database for testing:', error.message);
            this.useMock = true;
            return await mockDatabase.connect();
        }
    }

    async query(sql, params = []) {
        try {
            if (this.useMock) {
                return await mockDatabase.query(sql, params);
            }

            if (!this.connection) {
                await this.connect();
            }

            const [results] = await this.connection.execute(sql, params);
            return results;
        } catch (error) {
            if (!this.useMock) {
                console.error('Database query error, falling back to mock:', error.message);
                this.useMock = true;
                return await mockDatabase.query(sql, params);
            }
            throw error;
        }
    }

    async close() {
        if (this.useMock) {
            await mockDatabase.close();
        } else if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = new Database();

module.exports = new Database();
