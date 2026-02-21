const fs = require('fs');

if (fs.existsSync('public')) {
    fs.rmSync('public', { recursive: true, force: true });
}

fs.cpSync('client/dist', 'public', { recursive: true });
console.log('Successfully copied client/dist to public for Vercel deployment.');
