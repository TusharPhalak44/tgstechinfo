const pool = require('../config/database');

class Newsletter {
    static async subscribe(email) {
        const query = `
            INSERT INTO newsletter_subscribers (email)
            VALUES ($1)
            ON CONFLICT (email) DO NOTHING
            RETURNING *
        `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async unsubscribe(email) {
        const query = `
            UPDATE newsletter_subscribers 
            SET is_active = false 
            WHERE email = $1 
            RETURNING *
        `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findAll(active = true) {
        let query = 'SELECT * FROM newsletter_subscribers';
        const values = [];
        
        if (active) {
            query += ' WHERE is_active = true';
        }
        
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, values);
        return result.rows;
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM newsletter_subscribers WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }
}

module.exports = Newsletter;