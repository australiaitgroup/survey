const fs = require('fs');
const path = require('path');

// Remove the conflicting app.ts file
const appTsPath = path.join(__dirname, 'src', 'app.ts');
if (fs.existsSync(appTsPath)) {
    fs.unlinkSync(appTsPath);
    console.log('Removed conflicting app.ts file');
} else {
    console.log('app.ts file not found');
}

console.log('Cleanup completed');