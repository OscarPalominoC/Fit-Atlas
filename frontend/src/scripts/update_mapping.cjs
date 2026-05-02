const fs = require('fs');

const ourDataPath = 'd:\\projects\\Gym Tracker\\frontend\\src\\data\\exercises.ts';
const theirDataPath = 'C:\\Users\\Oscar\\.gemini\\antigravity\\brain\\7a7a395b-0649-435a-9e21-5177c7dfad95\\.system_generated\\steps\\644\\content.md';
const outputPath = 'd:\\projects\\Gym Tracker\\frontend\\src\\data\\gif_mapping.ts';

const ourData = fs.readFileSync(ourDataPath, 'utf8');
const theirFileContent = fs.readFileSync(theirDataPath, 'utf8');
const theirData = JSON.parse(theirFileContent.split('---')[1]);

const clean = s => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
const getWords = s => clean(s).split(/\s+/);

const synonyms = {
    'chest press': 'bench press',
    'bench press': 'chest press',
    'rdl': 'romanian deadlift',
    'ab wheel': 'ab roller',
    'ab roller': 'ab wheel',
    'knee raise': 'leg raise',
    'leg raise': 'knee raise',
    'fly': 'flyes',
    'flyes': 'fly',
    'triceps': 'tricep',
    'biceps': 'bicep',
    'back squat': 'barbell squat',
    'bulgarian split squat': 'split squat',
    'seated cable row': 'seated row',
    'box jumps': 'box jump',
};

const finalMapping = {};
const nameRegex = /\"name\": \"([^\"]+)\"/g;
let match;

while ((match = nameRegex.exec(ourData)) !== null) {
    const name = match[1].toLowerCase();
    let gifUrl = null;

    // 1. Try exact match
    const exactMatch = theirData.find(ex => ex.name.toLowerCase() === name);
    if (exactMatch) {
        gifUrl = exactMatch.gif_url;
    }

    // 2. Try synonyms
    if (!gifUrl) {
        let modifiedName = name;
        for (const [key, val] of Object.entries(synonyms)) {
            if (name.includes(key)) {
                modifiedName = name.replace(key, val);
                const synMatch = theirData.find(ex => ex.name.toLowerCase() === modifiedName);
                if (synMatch) {
                    gifUrl = synMatch.gif_url;
                    break;
                }
            }
        }
    }

    // 3. Word-based fuzzy match
    if (!gifUrl) {
        const ourWords = getWords(name);
        if (ourWords.length >= 2) {
            const bestMatch = theirData.find(ex => {
                const theirWords = getWords(ex.name);
                return ourWords.every(word => theirWords.includes(word));
            });
            if (bestMatch) gifUrl = bestMatch.gif_url;
        }
    }

    if (gifUrl) {
        finalMapping[name] = gifUrl;
    }
}

const content = `export const gifMapping: Record<string, string> = ${JSON.stringify(finalMapping, null, 2)};`;
fs.writeFileSync(outputPath, content);
console.log('Mapping updated successfully!');
