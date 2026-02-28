import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

const xlsxPath = path.resolve('uploads/meta.xlsx');
const exhibitsPath = path.resolve('assets/exhibits.json');
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
    if (!row.Filename) continue; // ha üres a fájlnév, kihagyjuk ezt a sort, vagyis még nincs feltöltve!

    exhibits.push({
        modelUrl: `releases/download/models/${row.Filename}`,
        title: row.Title || 'Ismeretlen',
        author: row.Author || 'Ismeretlen',
        license: row.License || 'Ismeretlen',
        sourceLink: row.SourceLink || ''
    });

    creditsHTML += `
  <div class="exhibit">
    <h2>${row.Title || 'Ismeretlen'}</h2>
    <p><strong>Szerző:</strong> ${row.Author || 'Ismeretlen'}</p>
    <p><strong>Licensz:</strong> ${row.License || 'Ismeretlen'}</p>
    <p><strong>Forrás:</strong> <a href="${row.SourceLink || '#'}" target="_blank">Sketchfab Link</a></p>
  </div>
  `;
}

creditsHTML += `
</body>
</html>`;

if (!fs.existsSync(path.dirname(exhibitsPath))) {
    fs.mkdirSync(path.dirname(exhibitsPath), { recursive: true });
}

fs.writeFileSync(exhibitsPath, JSON.stringify(exhibits, null, 2));
fs.writeFileSync(creditsPath, creditsHTML);

console.log(`Extracted ${exhibits.length} exhibits and generated config + CREDITS.html`);
