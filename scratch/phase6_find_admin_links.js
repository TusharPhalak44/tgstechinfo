const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
    const results = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
            if (f.name !== 'node_modules' && f.name !== 'dist' && f.name !== '.git') {
                results.push(...searchDir(fullPath, pattern));
            }
        } else if (f.name.endsWith('.jsx') || f.name.endsWith('.js') || f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (pattern.test(line)) {
                    results.push({
                        file: path.relative('c:/xampp/htdocs/tgspublish/frontend', fullPath),
                        line: idx + 1,
                        code: line.trim()
                    });
                }
            });
        }
    }
    return results;
}

// Search for frontend /admin links (excluding API calls like /api/admin)
const adminMatches = searchDir('c:/xampp/htdocs/tgspublish/frontend/src', /(navigate\(|to=|href=|redirect|Link)[\s(]*['"`]\/admin(\/|['"`])/);
console.log('Total /admin navigation occurrences in frontend/src:', adminMatches.length);
console.log(JSON.stringify(adminMatches, null, 2));

// Also search general /admin occurrences that are not /api/admin
const generalMatches = searchDir('c:/xampp/htdocs/tgspublish/frontend/src', /['"`]\/admin(\/|['"`])/);
console.log('\nTotal general non-api /admin occurrences:', generalMatches.length);
generalMatches.forEach(m => {
    if (!m.code.includes('/api/admin')) {
        console.log(`${m.file}:${m.line} -> ${m.code}`);
    }
});
