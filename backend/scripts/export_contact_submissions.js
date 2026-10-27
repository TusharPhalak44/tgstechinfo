const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function exportContactSubmissions() {
    try {
        console.log('Fetching contact_submissions from database...');
        const [rows] = await pool.query('SELECT * FROM contact_submissions ORDER BY id DESC');

        if (!rows || rows.length === 0) {
            console.log('No records found in contact_submissions table.');
            return;
        }

        const headers = Object.keys(rows[0]);
        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        };

        const csvRows = [
            headers.map(escapeCsv).join(','),
            ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(','))
        ];

        const outputDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, 'contact_submissions.csv');
        fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8'); // \uFEFF is UTF-8 BOM so Excel opens Hindi/special chars perfectly

        console.log(`✅ Success! Exported ${rows.length} record(s) to: ${outputPath}`);
    } catch (err) {
        console.error('Export failed:', err.message);
    } finally {
        process.exit(0);
    }
}

exportContactSubmissions();
