import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

const xlsxPath = path.resolve('uploads/meta.xlsx');
const tempExhibitsPath = path.resolve('tools/temp_exhibits.json');
const creditsPath = path.resolve('CREDITS.html');

if (!fs.existsSync(xlsxPath)) {
  console.log(`No meta.xlsx found at ${xlsxPath}. Skipping conversion.`);
  process.exit(0);
}

const workbook = xlsx.default ? xlsx.default.readFile(xlsxPath) : xlsx.readFile(xlsxPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const utils = xlsx.default ? xlsx.default.utils : xlsx.utils;
const data = utils.sheet_to_json(worksheet);

const exhibits = [];
let creditsHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Museum Credits</title>
  <style>
    body { font-family: sans-serif; background: #111; color: #eee; padding: 2rem; }
    .exhibit { margin-bottom: 2rem; padding: 1rem; background: #222; border-radius: 8px; }
    h2 { margin-top: 0; color: #4af; }
    a { color: #f4a; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Exhibit Credits</h1>
`;

for (const row of data) {
  if (!row.Filename) continue;

  const id = row.Filename.replace('.glb', '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  exhibits.push({
    id,
    modelUrl: `releases/download/models/${row.Filename}`,
    title: row.Title || 'Unknown Title',
    author: row.Author || 'Unknown Author',
    license: row.License || 'Unknown License',
    sourceLink: row.SourceLink || '',
    wing: row.Wing || null
  });

  creditsHTML += `
  <div class="exhibit">
    <h2>${row.Title || 'Unknown Title'}</h2>
    <p><strong>Author:</strong> ${row.Author || 'Unknown'}</p>
    <p><strong>License:</strong> ${row.License || 'Unknown'}</p>
    <p><strong>Source:</strong> <a href="${row.SourceLink || '#'}" target="_blank">Link</a></p>
  </div>
  `;
}

creditsHTML += `
</body>
</html>`;

fs.mkdirSync(path.dirname(tempExhibitsPath), { recursive: true });
fs.writeFileSync(tempExhibitsPath, JSON.stringify(exhibits, null, 2));
fs.writeFileSync(creditsPath, creditsHTML);

console.log(`Extracted ${exhibits.length} exhibits and generated CREDITS.html`);
