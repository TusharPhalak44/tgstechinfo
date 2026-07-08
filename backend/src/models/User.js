const { pool } = require('../config/database');

class User {
    static async create(userData) {
        const { first_name, last_name, email, password_hash, role = 'user' } = userData;
        const query = `
            INSERT INTO users (first_name, last_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [first_name, last_name, email, password_hash, role]);
        return await User.findById(result.insertId);
    }

    static async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, first_name, last_name, email, role, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async update(id, userData) {
        const { first_name, last_name, email, is_active } = userData;
        const query = `
            UPDATE users 
            SET first_name = ?, last_name = ?, email = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await pool.query(query, [first_name, last_name, email, is_active, id]);
        return await User.findById(id);
    }
}

module.exports = User;
