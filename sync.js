// sync.js - Converts file.csv to data.js
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'file.csv');
const outPath = path.join(__dirname, 'data.js');

try {
    const csv = fs.readFileSync(csvPath, 'utf8');
    const escaped = csv.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const output = `const csvData = \`${escaped}\`;\n`;
    fs.writeFileSync(outPath, output, 'utf8');
    console.log('[OK] data.js actualizado correctamente.');
    console.log(`     Preguntas encontradas: ${csv.split('\n').filter(l => l.trim() && !l.startsWith('question')).length}`);
} catch (err) {
    console.error('[ERROR]', err.message);
    process.exit(1);
}
