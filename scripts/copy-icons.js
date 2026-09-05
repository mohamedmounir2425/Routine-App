import { readFileSync, writeFileSync } from 'fs';
const src512 = readFileSync('public/icon-512.jpg');
writeFileSync('public/icon-512.png', src512);
writeFileSync('public/icon-192.png', src512);
console.log('Icons ready as PNG');
