// Simple build script to compile TypeScript without module wrappers
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });

// Remove module wrappers from compiled files
const distDir = path.join(__dirname, 'dist');

function removeModuleWrapper(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove UMD wrapper
  if (content.includes('(function (factory)')) {
    // Extract the actual code from inside the wrapper
    const match = content.match(/}\)\(function \(require, exports\) \{[\s\S]*"use strict";[\s\S]*Object\.defineProperty\(exports, "__esModule"[\s\S]*\}\);([\s\S]*)\}\);/);
    if (match) {
      content = match[1] || content;
    }
  }
  
  // Remove export statements
  content = content.replace(/^export\s+/gm, '');
  content = content.replace(/^exports\.\w+\s*=\s*/gm, '');
  
  // Fix any remaining issues
  content = content.replace(/}\);[\s\S]*?\/\/# sourceMappingURL/, '\n//# sourceMappingURL');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

// Process app.js
const appPath = path.join(distDir, 'app.js');
if (fs.existsSync(appPath)) {
  removeModuleWrapper(appPath);
}

// Process publicBanks components
const publicBanksDir = path.join(distDir, 'components', 'publicBanks');
if (fs.existsSync(publicBanksDir)) {
  fs.readdirSync(publicBanksDir).forEach(file => {
    if (file.endsWith('.js')) {
      removeModuleWrapper(path.join(publicBanksDir, file));
    }
  });
}

console.log('Build complete!');