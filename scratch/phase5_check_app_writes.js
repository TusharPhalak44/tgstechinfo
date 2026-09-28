const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '../backend/src');

function findFiles(dir, exts = ['.js']) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(findFiles(full, exts));
    } else if (exts.some(e => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

const files = findFiles(backendDir);
console.log(`Found ${files.length} backend JS files.`);

const searchTerms = ['contents', 'category_id', 'content_type_id', 'user_id'];
const matches = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      (line.includes('category_id') || line.includes('content_type_id') || line.includes('user_id')) &&
      (line.toLowerCase().includes('insert') || line.toLowerCase().includes('update') || line.toLowerCase().includes('delete') || line.toLowerCase().includes('contents'))
    ) {
      matches.push({
        file: path.relative(path.join(__dirname, '..'), file),
        line: idx + 1,
        text: line.trim()
      });
    }
  });
}

console.log(`Found ${matches.length} write/reference occurrences:`);
matches.slice(0, 30).forEach(m => console.log(`${m.file}:${m.line} ${m.text}`));
