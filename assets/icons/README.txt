#!/usr/bin/env node
// Script ini generate placeholder icon — jalankan sekali jika belum punya icon
// node generate-icons.js
// Atau langsung buat di Canva/Figma dengan warna #16a34a dan logo daun

const fs = require('fs');
const path = require('path');

console.log('📌 Untuk membuat icon PWA:');
console.log('1. Buka https://realfavicongenerator.net');
console.log('2. Upload logo atau gambar 512x512px');
console.log('3. Download hasilnya');
console.log('4. Letakkan icon-192.png dan icon-512.png di assets/icons/');
console.log('');
console.log('Atau buat di Canva:');
console.log('- Warna: #16a34a (hijau Kesling)');
console.log('- Ikon: daun / lingkungan / mikroskop');
console.log('- Export: 192x192 dan 512x512 PNG');
