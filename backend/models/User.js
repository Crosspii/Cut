const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    constructor(userData) {
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.phone = userData.phone;
        this.role = userData.role || 'customer';
    }

    // Hash password before saving
    async hashPassword() {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Save user to database
    async save() {
        try {
            await this.hashPassword();
            const query = `
                INSERT INTO users (name, email, password, phone, role) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const result = await db.query(query, [
                this.name, 
                this.email, 
                this.password, 
                this.phone, 
                this.role
            ]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = ?';
            const users = await db.query(query, [email]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = ?';
            const users = await db.query(query, [id]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            throw error;
        }
    }

    // Validate password
    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Update user
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });
            
            if (fields.length === 0) {
                throw new Error('No fields to update');
            }
            
            values.push(id);
            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            await db.query(query, values);
            
            return await User.findById(id);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
