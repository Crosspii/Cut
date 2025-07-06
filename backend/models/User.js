const database = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.phone = userData.phone;
        this.role = userData.role || 'customer';
        this.avatar = userData.avatar;
        this.email_verified = userData.email_verified || false;
        this.status = userData.status || 'active';
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // Hash password before saving
    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Compare password
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Create new user
    static async create(userData) {
        try {
            await database.connect();
            
            // Hash password
            const hashedPassword = await this.hashPassword(userData.password);
            
            const sql = `
                INSERT INTO users (name, email, password, phone, role) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const params = [
                userData.name,
                userData.email,
                hashedPassword,
                userData.phone,
                userData.role || 'customer'
            ];
            
            const result = await database.query(sql, params);
            
            // Get the created user
            return await this.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            await database.connect();
            
            const sql = 'SELECT * FROM users WHERE id = ?';
            const result = await database.query(sql, [id]);
            
            if (result.length === 0) {
                return null;
            }
            
            return new User(result[0]);
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            await database.connect();
            
            const sql = 'SELECT * FROM users WHERE email = ?';
            const result = await database.query(sql, [email]);
            
            if (result.length === 0) {
                return null;
            }
            
            return new User(result[0]);
        } catch (error) {
            throw error;
        }
    }

    // Update user
    static async updateById(id, userData) {
        try {
            await database.connect();
            
            const fields = [];
            const params = [];
            
            Object.keys(userData).forEach(key => {
                if (userData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    params.push(userData[key]);
                }
            });
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            params.push(id);
            
            const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            await database.query(sql, params);
            
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Check if email exists
    static async emailExists(email, excludeId = null) {
        try {
            await database.connect();
            
            let sql = 'SELECT id FROM users WHERE email = ?';
            let params = [email];
            
            if (excludeId) {
                sql += ' AND id != ?';
                params.push(excludeId);
            }
            
            const result = await database.query(sql, params);
            return result.length > 0;
        } catch (error) {
            throw error;
        }
    }

    // Authenticate user
    static async authenticate(email, password) {
        try {
            const user = await this.findByEmail(email);
            
            if (!user) {
                return null;
            }
            
            const isValidPassword = await this.comparePassword(password, user.password);
            
            if (!isValidPassword) {
                return null;
            }
            
            // Remove password from returned user object
            delete user.password;
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    // Get user profile (without password)
    toJSON() {
        const userObj = { ...this };
        delete userObj.password;
        return userObj;
    }
}

module.exports = User;