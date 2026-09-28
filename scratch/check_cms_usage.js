const fs = require('fs');
const path = require('path');

const cmsFiles = fs.readdirSync(path.join(__dirname, '../frontend/src/cms/core'));
console.log('Checking ' + cmsFiles.length + ' CMS files...');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('cms') && !fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        getAllFiles(fullPath, fileList);
      }
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFrontendFiles = getAllFiles(path.join(__dirname, '../frontend/src'));
console.log('Searching across ' + allFrontendFiles.length + ' active frontend files...');

const results = {};
for (const cmsFile of cmsFiles) {
  const baseName = cmsFile.replace('.js', '');
  results[cmsFile] = [];
  for (const f of allFrontendFiles) {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes(cmsFile) || content.includes('cms/core/' + baseName)) {
      results[cmsFile].push({ file: f, reason: 'direct path reference' });
    }
    const importRegex = new RegExp(`(import|from|require)[\\s(]+['"\`][^'"\`]*${baseName}[^'"\`]*['"\`]`);
    if (importRegex.test(content)) {
      results[cmsFile].push({ file: f, reason: 'import regex match' });
    }
  }
}

let anyUsed = false;
for (const [cmsFile, matches] of Object.entries(results)) {
  if (matches.length > 0) {
    console.log('FOUND MATCH FOR ' + cmsFile + ':', matches);
    anyUsed = true;
  }
}
if (!anyUsed) {
  console.log('CONFIRMED: ALL 22 CMS FILES HAVE ZERO IMPORTS IN THE ACTIVE FRONTEND TREE!');
}
