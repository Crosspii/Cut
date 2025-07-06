// Mock database for testing when MySQL is not available
const bcrypt = require('bcrypt');

class MockDatabase {
    constructor() {
        this.users = [];
        this.nextId = 1;
    }

    async connect() {
        console.log('✅ Mock Database connected successfully');
        return true;
    }

    async query(sql, params = []) {
        // Mock implementation of common SQL operations
        const lowerSql = sql.toLowerCase();

        if (lowerSql.includes('insert into users')) {
            // Insert user
            const user = {
                id: this.nextId++,
                name: params[0],
                email: params[1],
                password: params[2],
                phone: params[3],
                role: params[4] || 'customer',
                avatar: null,
                email_verified: false,
                status: 'active',
                created_at: new Date(),
                updated_at: new Date()
            };
            
            // Check for duplicate email
            if (this.users.find(u => u.email === user.email)) {
                const error = new Error('Duplicate entry');
                error.code = 'ER_DUP_ENTRY';
                throw error;
            }
            
            this.users.push(user);
            return { insertId: user.id };
        }

        if (lowerSql.includes('select * from users where id')) {
            // Find by ID
            const id = params[0];
            const user = this.users.find(u => u.id === parseInt(id));
            return user ? [user] : [];
        }

        if (lowerSql.includes('select * from users where email')) {
            // Find by email
            const email = params[0];
            const user = this.users.find(u => u.email === email);
            return user ? [user] : [];
        }

        if (lowerSql.includes('select id from users where email')) {
            // Check email exists
            const email = params[0];
            const user = this.users.find(u => u.email === email);
            return user ? [{ id: user.id }] : [];
        }

        if (lowerSql.includes('update users set')) {
            // Update user
            const userId = params[params.length - 1];
            const userIndex = this.users.findIndex(u => u.id === parseInt(userId));
            
            if (userIndex === -1) {
                return { affectedRows: 0 };
            }

            // Parse update fields (simplified)
            const user = this.users[userIndex];
            user.updated_at = new Date();
            
            return { affectedRows: 1 };
        }

        return [];
    }

    async close() {
        console.log('Mock Database connection closed');
    }
}

module.exports = new MockDatabase();