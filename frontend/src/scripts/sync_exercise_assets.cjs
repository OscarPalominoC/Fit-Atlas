const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ROOT = path.resolve(__dirname, '../../..');
const FRONTEND_ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_ROOT = path.resolve(FRONTEND_ROOT, '..');

const exercisesPath = path.join(FRONTEND_ROOT, 'src/data/exercises.ts');
const mappingPath = path.join(FRONTEND_ROOT, 'src/data/gif_mapping.ts');
const backendMappingPath = path.join(WORKSPACE_ROOT, 'backend/scripts/exercise_media_assets.py');
const frontendAssetsDir = path.join(FRONTEND_ROOT, 'public/exercise-gifs');
const backendAssetsDir = path.join(WORKSPACE_ROOT, 'backend/static/exercise-gifs');
const reportPath = path.join(FRONTEND_ROOT, 'src/data/exercise_media_report.json');

const REJECTED_MAPPINGS = {
  'bulgarian split squat': 'Maps to a jump-squat variant, not the described controlled split squat.',
  'single leg hip thrust': 'Maps to a jump variant, not the described hip thrust.',
  'single leg rdl': 'Maps to a single-leg press, not a Romanian deadlift hinge.',
  'hamstring curl': 'Maps to a nordic curl, not a machine hamstring curl.',
  'copenhagen plank': 'Maps to a generic plank instead of a Copenhagen plank.',
  'plank jacks': 'Maps to a generic plank instead of plank jacks.',
  'side leg raise': 'Maps to a generic lying leg raise, not lateral hip abduction.',
  'overhead triceps extension': 'Maps to a banded triceps extension while the exercise describes a dumbbell overhead extension.',
  'skull crushers': 'Maps to a bodyweight skull crusher while the exercise describes an EZ-bar skull crusher.',
  'triceps kickback': 'Maps to a cable kickback while the exercise describes a dumbbell kickback.',
};

function parseObjectExport(content, exportName) {
  const marker = `export const ${exportName}`;
  const start = content.indexOf(marker);
  if (start === -1) throw new Error(`Could not find ${exportName}`);
  const equals = content.indexOf('=', start);
  const objectStart = content.indexOf('{', equals);
  let depth = 0;
  for (let i = objectStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') depth--;
    if (depth === 0) {
      return Function(`"use strict"; return (${content.slice(objectStart, i + 1)});`)();
    }
  }
  throw new Error(`Could not parse ${exportName}`);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extensionFor(url, contentType) {
  const cleanUrl = url.split('?')[0].toLowerCase();
  const ext = path.extname(cleanUrl);
  if (['.gif', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  if (contentType?.includes('webp')) return '.webp';
  return '.gif';
}

async function download(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'FitAtlas asset sync',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
    validateStatus: status => status >= 200 && status < 300,
  });
  return {
    bytes: Buffer.from(response.data),
    contentType: response.headers['content-type'] || '',
  };
}

function writeFrontendMapping(mapping) {
  const content = `// Auto-generated mapping. Do not edit manually.\nexport const gifMapping: Record<string, string> = ${JSON.stringify(mapping, null, 2)};\n`;
  fs.writeFileSync(mappingPath, content, 'utf8');
}

function writeBackendMapping(mediaBySlug) {
  const content = `# Auto-generated exercise media mapping. Do not edit manually.\nEXERCISE_MEDIA_BY_SLUG = ${JSON.stringify(mediaBySlug, null, 4)}\n`;
  fs.writeFileSync(backendMappingPath, content, 'utf8');
}

async function run() {
  fs.mkdirSync(frontendAssetsDir, { recursive: true });
  fs.mkdirSync(backendAssetsDir, { recursive: true });

  const exercises = parseObjectExport(fs.readFileSync(exercisesPath, 'utf8'), 'exercises');
  const remoteMapping = parseObjectExport(fs.readFileSync(mappingPath, 'utf8'), 'gifMapping');

  const localMapping = {};
  const backendMediaBySlug = {};
  const report = {
    generatedAt: new Date().toISOString(),
    downloaded: [],
    rejected: [],
    failed: [],
    missing: [],
  };

  for (const exercise of Object.values(exercises)) {
    const key = exercise.name.toLowerCase();
    const sourceUrl = remoteMapping[key];
    if (!sourceUrl) {
      report.missing.push({ name: exercise.name, slug: exercise.slug });
      continue;
    }

    if (REJECTED_MAPPINGS[key]) {
      report.rejected.push({
        name: exercise.name,
        slug: exercise.slug,
        sourceUrl,
        reason: REJECTED_MAPPINGS[key],
      });
      continue;
    }

    try {
      let assetPath;
      if (sourceUrl.startsWith('/exercise-gifs/')) {
        assetPath = sourceUrl;
      } else {
        const { bytes, contentType } = await download(sourceUrl);
        const ext = extensionFor(sourceUrl, contentType);
        const fileName = `${slugify(exercise.slug || exercise.name)}${ext}`;
        const frontendFile = path.join(frontendAssetsDir, fileName);
        const backendFile = path.join(backendAssetsDir, fileName);
        fs.writeFileSync(frontendFile, bytes);
        fs.writeFileSync(backendFile, bytes);
        assetPath = `/exercise-gifs/${fileName}`;
      }

      localMapping[key] = assetPath;
      backendMediaBySlug[exercise.slug] = { gif: assetPath };
      report.downloaded.push({
        name: exercise.name,
        slug: exercise.slug,
        sourceUrl,
        assetPath,
      });
      console.log(`OK ${exercise.name} -> ${assetPath}`);
    } catch (error) {
      report.failed.push({
        name: exercise.name,
        slug: exercise.slug,
        sourceUrl,
        error: error.message,
      });
      console.warn(`FAIL ${exercise.name}: ${error.message}`);
    }
  }

  writeFrontendMapping(localMapping);
  writeBackendMapping(backendMediaBySlug);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\nSummary');
  console.log(`Downloaded: ${report.downloaded.length}`);
  console.log(`Rejected: ${report.rejected.length}`);
  console.log(`Missing: ${report.missing.length}`);
  console.log(`Failed: ${report.failed.length}`);
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
