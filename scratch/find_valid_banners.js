const fs = require('fs');
const { pool } = require('../backend/src/config/database');

async function findValid() {
  const [rows] = await pool.query(`
    SELECT c.id, c.title, c.banner_image, cat.name as category_name
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.status = 'published' AND c.banner_image IS NOT NULL
  `);
  const valid = rows.filter(r => fs.existsSync('backend/uploads/' + r.banner_image));
  console.log('Total published articles with existing banner on disk:', valid.length);
  
  const ai = valid.filter(r => (r.category_name && r.category_name.toLowerCase().includes('ai')) || r.title.toLowerCase().includes('ai'));
  const cyber = valid.filter(r => (r.category_name && r.category_name.toLowerCase().includes('cyber')) || r.title.toLowerCase().includes('security'));
  const cloud = valid.filter(r => (r.category_name && r.category_name.toLowerCase().includes('cloud')) || r.title.toLowerCase().includes('cloud'));
  const data = valid.filter(r => (r.category_name && r.category_name.toLowerCase().includes('data')) || r.title.toLowerCase().includes('data'));

  console.log('AI top 3:', ai.slice(0, 3));
  console.log('Cybersecurity top 3:', cyber.slice(0, 3));
  console.log('Cloud top 3:', cloud.slice(0, 3));
  console.log('Data top 3:', data.slice(0, 3));
  process.exit(0);
}

findValid();
