const express = require('express');
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

console.log('=== ALL REGISTERED BACKEND ROUTES IN backend/src/routes ===\n');

const allEndpoints = [];

for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to match router.get/post/put/delete/patch
    const regex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const routePath = match[2];
        allEndpoints.push({
            file,
            method,
            routePath
        });
    }
}

console.log(`Total Endpoints Found: ${allEndpoints.length}\n`);
for (const ep of allEndpoints) {
    console.log(`[${ep.method.padEnd(6)}] ${ep.file.padEnd(28)} -> ${ep.routePath}`);
}

fs.writeFileSync(path.join(__dirname, 'endpoints_inventory.json'), JSON.stringify(allEndpoints, null, 2));
console.log('\nSaved endpoints inventory to backend/scripts/endpoints_inventory.json');
