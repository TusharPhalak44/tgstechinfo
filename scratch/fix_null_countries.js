const path = require('path');
const pool = require(path.join(__dirname, '../backend/src/config/database')).pool;

async function fixNullCountries() {
  try {
    const [res] = await pool.query("UPDATE visitor_sessions SET country = 'India' WHERE country IS NULL");
    console.log('Updated null country sessions:', res.affectedRows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fixNullCountries();
