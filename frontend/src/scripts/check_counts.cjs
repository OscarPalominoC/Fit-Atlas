const fs = require('fs');
const content = fs.readFileSync('d:\\projects\\Gym Tracker\\frontend\\src\\data\\exercises.ts', 'utf8');
const names = content.match(/\"name\": \"([^\"]+)\"/g) || [];
console.log('Total exercises in database:', names.length);

const mapping = fs.readFileSync('d:\\projects\\Gym Tracker\\frontend\\src\\data\\gif_mapping.ts', 'utf8');
const matches = mapping.match(/:/g) || [];
console.log('Exercises with GIFs:', matches.length);
