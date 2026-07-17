const { pool } = require('../config/database');

class VideoProgress {
    static async create(progressData) {
        const {
            session_uuid,
            consent_uuid,
            content_id,
            video_started_at,
            video_25_percent_at,
            video_50_percent_at,
            video_75_percent_at,
            video_completed_at,
            duration_watched_seconds,
            total_duration_seconds
        } = progressData;

        const query = `
            INSERT INTO video_progress (
                session_uuid, consent_uuid, content_id, video_started_at,
                video_25_percent_at, video_50_percent_at, video_75_percent_at,
                video_completed_at, duration_watched_seconds, total_duration_seconds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                video_started_at = COALESCE(VALUES(video_started_at), video_started_at),
                video_25_percent_at = COALESCE(VALUES(video_25_percent_at), video_25_percent_at),
                video_50_percent_at = COALESCE(VALUES(video_50_percent_at), video_50_percent_at),
                video_75_percent_at = COALESCE(VALUES(video_75_percent_at), video_75_percent_at),
                video_completed_at = COALESCE(VALUES(video_completed_at), video_completed_at),
                duration_watched_seconds = VALUES(duration_watched_seconds),
                total_duration_seconds = VALUES(total_duration_seconds)
        `;

        const values = [
            session_uuid, consent_uuid, content_id, video_started_at,
            video_25_percent_at, video_50_percent_at, video_75_percent_at,
            video_completed_at, duration_watched_seconds, total_duration_seconds
        ];

        await pool.query(query, values);
        return await VideoProgress.findBySessionAndContent(session_uuid, content_id);
    }

    static async findById(id) {
        const query = 'SELECT * FROM video_progress WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0];
    }

    static async findBySessionAndContent(session_uuid, content_id) {
        const query = 'SELECT * FROM video_progress WHERE session_uuid = ? AND content_id = ?';
        const [rows] = await pool.query(query, [session_uuid, content_id]);
        return rows[0];
    }

    static async updateProgress(id, updateData) {
        const allowedFields = [
            'video_25_percent_at', 'video_50_percent_at', 'video_75_percent_at',
            'video_completed_at', 'duration_watched_seconds', 'total_duration_seconds'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (updates.length === 0) return null;

        values.push(id);
        await pool.query(`UPDATE video_progress SET ${updates.join(', ')} WHERE id = ?`, values);
        return await VideoProgress.findById(id);
    }

    static async getContentStats(contentId) {
        const query = `
            SELECT 
                COUNT(*) as total_views,
                COUNT(DISTINCT session_uuid) as unique_views,
                SUM(CASE WHEN video_25_percent_at IS NOT NULL THEN 1 ELSE 0 END) as reached_25_percent,
                SUM(CASE WHEN video_50_percent_at IS NOT NULL THEN 1 ELSE 0 END) as reached_50_percent,
                SUM(CASE WHEN video_75_percent_at IS NOT NULL THEN 1 ELSE 0 END) as reached_75_percent,
                SUM(CASE WHEN video_completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_count,
                AVG(duration_watched_seconds) as avg_duration_watched,
                AVG(total_duration_seconds) as avg_total_duration
            FROM video_progress
            WHERE content_id = ?
        `;

        const [rows] = await pool.query(query, [contentId]);
        return rows[0];
    }
}

module.exports = VideoProgress;
