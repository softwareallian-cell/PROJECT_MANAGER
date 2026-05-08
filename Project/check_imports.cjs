const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
let issues = [];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match: import ... from './path' or import './path'
    const fromMatch = line.match(/from\s+['"](\.[^'"]+)['"]/);
    const directMatch = line.match(/import\s+['"](\.[^'"]+)['"]/);
    
    const importPath = fromMatch ? fromMatch[1] : directMatch ? directMatch[1] : null;
    if (!importPath) continue;
    
    const dir = path.dirname(filePath);
    const resolved = path.resolve(dir, importPath);
    
    // Check if it exists as-is, or with extensions
    const candidates = [
      resolved,
      resolved + '.js',
      resolved + '.jsx',
      resolved + '.css',
      resolved + '/index.js',
      resolved + '/index.jsx',
    ];
    
    const found = candidates.some(c => fs.existsSync(c));
    if (!found) {
      const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');
      issues.push({ file: rel, line: i + 1, import: importPath });
    }
  }
}

walkDir(srcDir);

if (issues.length === 0) {
  console.log('ALL IMPORTS ARE VALID - No broken imports found!');
} else {
  console.log(`FOUND ${issues.length} BROKEN IMPORT(S):\n`);
  for (const issue of issues) {
    console.log(`  FILE: ${issue.file}`);
    console.log(`  LINE: ${issue.line}`);
    console.log(`  IMPORT: ${issue.import}`);
    console.log('');
  }
}
