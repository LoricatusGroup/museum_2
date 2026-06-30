import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

const xlsxPath = path.resolve('uploads/meta.xlsx');
const exhibitsPath = path.resolve('assets/exhibits.json');
const creditsPath = path.resolve('CREDITS.html');

// A modellek a "models" GitHub Release-en élnek; ABSZOLÚT URL kell, mert a relatív út
// projekt-aloldalon (/museum_2/) vagy egyedi domainen eltörik. Felülírható env-ből.
const MODEL_BASE = process.env.MODEL_BASE_URL
    || 'https://github.com/LoricatusGroup/museum_2/releases/download/models/';

// HTML-escape és URL-validálás a tárolt XSS ellen (a meta.xlsx külső/emberi input).
function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
function safeUrl(u) {
    u = String(u == null ? '' : u);
    // Csak http(s)-t engedünk, és attribútumba is escape-eljük (idézőjel-kitörés ellen).
    return /^https?:\/\//i.test(u) ? escapeHtml(u) : '#';
}

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

let skipped = 0;
for (const row of data) {
    if (!row.Filename) {
        // Üres fájlnév = a modell még nincs feltöltve. NE némán hagyjuk ki: jelezzük!
        skipped++;
        console.warn(`⚠️  Kihagyva (nincs Filename / feltöltött modell): "${row.Title || '(névtelen sor)'}"`);
        continue;
    }

    exhibits.push({
        modelUrl: `${MODEL_BASE}${row.Filename}`,
        title: row.Title || 'Ismeretlen',
        author: row.Author || 'Ismeretlen',
        license: row.License || 'Ismeretlen',
        sourceLink: row.SourceLink || '',
        year: row.Year || ''   // opcionális Year oszlop; ha nincs, üres (nem a megtévesztő "Sketchfab")
    });

    creditsHTML += `
  <div class="exhibit">
    <h2>${escapeHtml(row.Title || 'Ismeretlen')}</h2>
    <p><strong>Szerző:</strong> ${escapeHtml(row.Author || 'Ismeretlen')}</p>
    <p><strong>Licensz:</strong> ${escapeHtml(row.License || 'Ismeretlen')}</p>
    <p><strong>Forrás:</strong> <a href="${safeUrl(row.SourceLink)}" target="_blank" rel="noopener">Sketchfab Link</a></p>
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

console.log(`Kész: ${exhibits.length} kiállítási tárgy beírva, ${skipped} sor kihagyva (nincs feltöltött modell). CREDITS.html frissítve.`);
if (skipped > 0) {
    console.warn(`FIGYELEM: ${skipped}/${data.length} kiállítási tárgy hiányzik, mert nincs hozzá feltöltött GLB fájl (üres Filename a meta.xlsx-ben).`);
}
