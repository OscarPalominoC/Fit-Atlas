const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load the generated mapping
const mappingPath = path.join(__dirname, '../data/gif_mapping.ts');
const mappingContent = fs.readFileSync(mappingPath, 'utf8');
// Extract the object literal
const objMatch = mappingContent.match(/export const gifMapping: Record<string, string> = (\{[\s\S]*?\});/);
if (!objMatch) {
  console.error('Could not parse gifMapping file.');
  process.exit(1);
}
let gifMapping = {};
try {
  // Evaluate the object safely
  // eslint-disable-next-line no-eval
  gifMapping = eval('(' + objMatch[1] + ')');
} catch (e) {
  console.error('Failed to evaluate mapping object:', e);
  process.exit(1);
}

async function verify() {
  const results = [];
  const entries = Object.entries(gifMapping);
  console.log(`Verificando ${entries.length} animaciones...`);
  for (const [name, url] of entries) {
    try {
      const response = await axios.head(url, { timeout: 10000 });
      const status = response.status;
      if (status >= 200 && status < 300) {
        results.push({ name, url, ok: true });
      } else {
        results.push({ name, url, ok: false, status });
        console.warn(`⚠️ ${name}: HTTP ${status}`);
      }
    } catch (err) {
      results.push({ name, url, ok: false, error: err.message });
      console.warn(`❌ ${name}: ${err.message}`);
    }
  }
  const failed = results.filter(r => !r.ok);
  console.log('\nResumen:');
  console.log(`✅ OK: ${results.length - failed.length}`);
  console.log(`❌ Fallidas: ${failed.length}`);
  if (failed.length) {
    console.log('\nLista de fallas:');
    failed.forEach(f => {
      console.log(`- ${f.name}: ${f.url} (${f.status || f.error})`);
    });
  }
}

verify();
