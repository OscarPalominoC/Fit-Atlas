const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONFIG = {
  localExercisesPath: path.join(__dirname, '../data/exercises.ts'),
  outputPath: path.join(__dirname, '../data/gif_mapping.ts'),
  sources: [
    {
      name: 'hasaneyldrm',
      url: 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json',
      baseUrl: 'https://github.com/hasaneyldrm/exercises-dataset/raw/main/',
      type: 'json_hasaneyldrm'
    },
    {
      name: 'omercotkd',
      url: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/exercises.csv',
      baseUrl: 'https://github.com/omercotkd/exercises-gifs/raw/main/assets/',
      type: 'csv'
    },
    {
      name: 'azilRababe',
      url: 'https://raw.githubusercontent.com/azilRababe/Exercises_Dataset/main/gifs_data.json',
      type: 'json_azilRababe'
    }
  ]
};

const MANUAL_MAPPING = {
  'chest fly': 'https://github.com/omercotkd/exercises-gifs/raw/main/assets/0308.gif',
  'cable crossover': 'https://github.com/omercotkd/exercises-gifs/raw/main/assets/0166.gif',
  'plank': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/front-plank.gif',
  'superman': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Superman-exercise.gif',
  'bird dog': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Bird-Dog.gif',
  'hollow hold': 'https://fitnessprogramer.com/wp-content/uploads/2022/02/Hollow-Hold.gif',
  'toes to bar': 'https://fitnessprogramer.com/wp-content/uploads/2021/05/Toes-To-Bar.gif',
  'ab wheel rollout': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Ab-Wheel-Rollout.gif',
  'hip thrust': 'https://github.com/omercotkd/exercises-gifs/raw/main/assets/1059.gif',
  'back squat': 'https://github.com/omercotkd/exercises-gifs/raw/main/assets/0043.gif',
  'hiking': 'https://fitnessprogramer.com/wp-content/uploads/2022/02/Walking.gif',
  'cycling': 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Stationary-Bike.gif',
  'plate pinch hold': 'https://fitnessprogramer.com/wp-content/uploads/2024/06/Weight-Plate-Hand-Squeeze.gif',
  'snatch grip shrug': 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Barbell-Snatch-Grip-Shrug.gif',
  'meadows row': 'https://fitnessprogramer.com/wp-content/uploads/2021/10/One-Arm-Landmine-Row.gif',
  'woodchopper': 'https://fitnessprogramer.com/wp-content/uploads/2021/04/Cable-Kneeling-Wood-Chop.gif',
  'adductor machine': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/HIP-ADDUCTION-MACHINE.gif',
  'man makers': 'https://fitnessprogramer.com/wp-content/uploads/2021/06/Dumbbell-Burpees.gif',
  'sled push': 'https://liftmanual.com/wp-content/uploads/2023/04/power-sled-push.gif'
};

const IGNORE_WORDS = ['dumbbell', 'barbell', 'cable', 'machine', 'lever', 'kettlebell', 'weighted', 'bodyweight', 'assisted', 'resistance', 'band', 'plate', 'smith', 'alternate', 'lateral'];

const SYNONYMS = {
  'chest press': 'bench press',
  'press up': 'push up',
  'chin up': 'pull up',
  'bicep curl': 'biceps curl',
  'tricep pushdown': 'triceps pushdown',
  'tricep extension': 'triceps extension',
  'dead lift': 'deadlift',
  'fly': 'flyes',
  'shoulder press': 'military press',
  'lat pulldown': 'lateral pulldown',
  'farmer carry': 'farmers walk',
  'thrusters': 'barbell thruster',
  'frog pumps': 'glute bridge',
  'clamshell': 'lying hip abduction',
  'fire hydrant': 'hip extension'
};

function normalize(text) {
  if (!text) return '';
  let normalized = text.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  for (const [key, value] of Object.entries(SYNONYMS)) {
    if (normalized.includes(key)) {
      normalized = normalized.replace(key, value);
    }
  }
  
  return normalized;
}

function getScore(name1, name2) {
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  if (n1 === n2) return 1.0;
  
  const words1 = n1.split(' ');
  const words2 = n2.split(' ');
  
  let intersection = 0;
  const w2Set = new Set(words2);
  
  for (const w1 of words1) {
    if (w2Set.has(w1)) {
      intersection++;
    } else {
      for (const w2 of words2) {
        if ((w1.startsWith(w2) || w2.startsWith(w1)) && Math.min(w1.length, w2.length) >= 3) {
          intersection += 0.8;
          break;
        }
      }
    }
  }
  
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

async function run() {
  console.log('🚀 Starting ULTIMATE mapping process...');
  
  const localContent = fs.readFileSync(CONFIG.localExercisesPath, 'utf8');
  const localExercises = [];
  const exerciseRegex = /"([^"]+)":\s*\{[\s\S]*?"name":\s*"([^"]+)"/g;
  let match;
  while ((match = exerciseRegex.exec(localContent)) !== null) {
    localExercises.push({ id: match[1], name: match[2] });
  }
  
  const mapping = {};
  const missing = [];
  const allExternal = [];

  for (const source of CONFIG.sources) {
    try {
      const response = await axios.get(source.url);
      if (source.type === 'json_hasaneyldrm') {
        response.data.forEach(item => {
          allExternal.push({
            name: item.name,
            url: source.baseUrl + item.gif_url
          });
        });
      } else if (source.type === 'csv') {
        const lines = response.data.split('\n').slice(1);
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 4) {
            allExternal.push({
              name: parts[3],
              url: source.baseUrl + parts[2] + '.gif'
            });
          }
        });
      } else if (source.type === 'json_azilRababe') {
        response.data.forEach(item => {
          allExternal.push({
            name: item.title,
            url: item.gif_url
          });
        });
      }
    } catch (err) {
      console.error(`❌ Error fetching ${source.name}: ${err.message}`);
    }
  }

  for (const local of localExercises) {
    const nameLower = local.name.toLowerCase();
    
    if (MANUAL_MAPPING[nameLower]) {
      mapping[nameLower] = MANUAL_MAPPING[nameLower];
      continue;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const ext of allExternal) {
      const score = getScore(local.name, ext.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ext;
      }
      if (score >= 0.95) break;
    }

    if (bestScore >= 0.4) {
      mapping[nameLower] = bestMatch.url;
    } else {
      missing.push(local.name);
    }
  }

  const outputContent = `// Auto-generated mapping. Do not edit manually.
export const gifMapping: Record<string, string> = ${JSON.stringify(mapping, null, 2)};\n`;
  fs.writeFileSync(CONFIG.outputPath, outputContent);
  
  console.log('\n📊 Final Stats:');
  console.log(`- Coverage: ${((Object.keys(mapping).length / localExercises.length) * 100).toFixed(2)}%`);
  console.log(`- Found: ${Object.keys(mapping).length}`);
  
  if (missing.length > 0) {
    console.log('\n❓ Remaining Missing:');
    missing.forEach(m => console.log(`  - ${m}`));
  } else {
    console.log('\n✨ 100% COVERAGE ACHIEVED! ✨');
  }
}

run();
