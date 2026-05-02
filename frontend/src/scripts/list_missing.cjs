const fs = require('fs');

const ourDataPath = 'd:\\projects\\Gym Tracker\\frontend\\src\\data\\exercises.ts';
const mappingPath = 'd:\\projects\\Gym Tracker\\frontend\\src\\data\\gif_mapping.ts';

const ourData = fs.readFileSync(ourDataPath, 'utf8');
const mappingContent = fs.readFileSync(mappingPath, 'utf8');

// Extract exercise names
const nameRegex = /\"name\": \"([^\"]+)\"/g;
const ourNames = [];
let match;
while ((match = nameRegex.exec(ourData)) !== null) {
    ourNames.push(match[1]);
}

// Extract keys from gif_mapping.ts (handles comments)
const keyRegex = /^\s+\"([^\"]+)\":\s*\"(?:https|\/exercise-gifs\/)/gm;
const mappingKeys = new Set();
let km;
while ((km = keyRegex.exec(mappingContent)) !== null) {
    mappingKeys.add(km[1].toLowerCase());
}

console.log(`Total exercises: ${ourNames.length}`);
console.log(`Total GIF mappings: ${mappingKeys.size}`);
console.log('');

const missing = ourNames.filter(name => !mappingKeys.has(name.toLowerCase()));
const covered = ourNames.filter(name => mappingKeys.has(name.toLowerCase()));

console.log(`✅ Covered: ${covered.length}`);
console.log(`❌ Missing: ${missing.length}`);
if (missing.length > 0) {
    console.log('\nMissing exercises:');
    missing.forEach(name => console.log('  -', name));
}
