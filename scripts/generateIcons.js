import fs from 'node:fs';
import path from 'node:path';

const iconDir = path.resolve('public/icons');
fs.mkdirSync(iconDir, { recursive: true });

// Adaptive SVG Icon for BodyTrain
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#2D6A4F"/>
  <circle cx="256" cy="140" r="44" fill="#D8F3DC"/>
  <!-- Stylized dynamic human figure in morning wakeup pose -->
  <path d="M256 195 L256 320 M256 240 L160 170 M256 240 L352 170 M256 320 L180 430 M256 320 L332 430" 
        stroke="#D8F3DC" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="352" cy="170" r="14" fill="#F4A261"/>
</svg>`;

fs.writeFileSync(path.join(iconDir, 'icon.svg'), svgIcon, 'utf-8');
console.log('Generated icon.svg');

// For PNG icons, we can write a clean base64 PNG or use node to generate placeholder PNGs
// Simple solid PNG 192x192 & 512x512 with green background or SVG
fs.writeFileSync(path.join(iconDir, 'icon-192.png'), Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA6SURBVHhe7cExAQAAAMKg9U9tCj+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIB3A1WAAAFoW97yAAAAAElFTkSuQmCC',
  'base64'
));
fs.writeFileSync(path.join(iconDir, 'icon-512.png'), Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABTSURBVHhe7cExAQAAAMKg9U9tDQ8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBvA8UAAAFn5bK1AAAAAElFTkSuQmCC',
  'base64'
));

console.log('Generated icon-192.png and icon-512.png');
