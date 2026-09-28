const https = require('https');
const fs = require('fs');
const path = require('path');

const agent = new https.Agent({ rejectUnauthorized: false });

const images = [
  {
    name: 'hero_ai.jpg',
    url: 'https://wsrv.nl/?url=https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    tag: 'Artificial Intelligence'
  },
  {
    name: 'hero_cybersecurity.jpg',
    url: 'https://wsrv.nl/?url=https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    tag: 'Cybersecurity'
  },
  {
    name: 'hero_cloud.jpg',
    url: 'https://wsrv.nl/?url=https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    tag: 'Cloud Computing'
  },
  {
    name: 'hero_data.jpg',
    url: 'https://wsrv.nl/?url=https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
    tag: 'Data Analytics'
  }
];

const destDir = path.join(__dirname, '../frontend/public/images/hero');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const distDir = path.join(__dirname, '../frontend/dist/images/hero');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function downloadOne(item) {
  const filePath = path.join(destDir, item.name);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(item.url, { agent, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode} for ${item.name}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const size = fs.statSync(filePath).size;
        console.log(`✅ Downloaded ${item.tag} (${item.name}) -> ${size} bytes`);
        // Also copy to distDir
        fs.copyFileSync(filePath, path.join(distDir, item.name));
        resolve();
      });
    }).on('error', err => {
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading exact original hero images...');
  for (const item of images) {
    try {
      await downloadOne(item);
    } catch (err) {
      console.error(`❌ Error downloading ${item.name}:`, err.message);
    }
  }
  console.log('All downloads completed!');
  process.exit(0);
}

run();
