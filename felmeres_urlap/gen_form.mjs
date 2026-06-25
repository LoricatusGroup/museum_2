import fs from 'fs';

const jsonPath = process.argv[2] || 'questions.json';
const outPath = process.argv[3] || 'form.html';
const doc = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const CSS = `
  @page { size: A4; margin: 13mm 13mm 15mm 13mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "DejaVu Sans", Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 10.1pt; line-height: 1.32; }
  .cover { border: 2px solid #b4541f; border-radius: 6px; padding: 13px 15px; margin-bottom: 12px; }
  .cover h1 { margin: 0 0 2px 0; font-size: 17.5pt; color: #b4541f; }
  .cover .sub { margin: 0 0 9px 0; font-size: 9.6pt; color: #444; }
  .meta-row { display: flex; gap: 14px; margin-top: 7px; }
  .meta-field { flex: 1; font-size: 9pt; }
  .meta-field .lbl { color: #555; display:block; margin-bottom: 1px; }
  .fill { border-bottom: 1px solid #999; display:block; height: 15px; }
  .howto { background: #f6efe9; border-left: 4px solid #b4541f; padding: 8px 12px; margin-bottom: 14px; font-size: 9.2pt; }
  .howto b { color: #b4541f; }
  .legendbox { display:inline-block; width: 12px; height: 12px; border: 1.3px solid #333; vertical-align: -2px; margin: 0 2px; position: relative; }
  .legendbox.x::after { content: "✗"; position:absolute; top:-5px; left:1px; font-size: 12px; color:#b4541f; font-weight:700; }
  .section-head { background: #b4541f; color: #fff; padding: 6px 12px; border-radius: 4px; margin: 16px 0 4px 0; break-after: avoid; page-break-after: avoid; }
  .section-head .stitle { font-size: 12.3pt; font-weight: 700; }
  .section-head .swho { font-size: 8.7pt; font-weight: 400; opacity: .95; display:block; margin-top:1px; }
  .q { border-bottom: 1px dotted #cfcfcf; padding: 6px 2px 7px 2px; break-inside: avoid; page-break-inside: avoid; }
  .qt { margin: 0 0 4px 0; font-weight: 700; }
  .qt .num { color: #b4541f; margin-right: 4px; }
  .qt .hint { font-weight: 400; font-size: 8.7pt; color: #777; }
  .opts { padding-left: 2px; }
  .opts.cols2 { column-count: 2; column-gap: 20px; }
  .opt { display: block; padding: 1.3px 0; break-inside: avoid; }
  .box { display:inline-block; width: 12px; height: 12px; border: 1.3px solid #444; vertical-align: -2px; margin-right: 6px; border-radius: 2px; }
  .opt.dk .box { border-style: dashed; }
  .other { padding: 3px 0 0 0; }
  .other .oline { border-bottom: 1px solid #999; display:inline-block; min-width: 58%; height: 14px; vertical-align: -2px; }
  .lines .ln { border-bottom: 1px solid #aaa; height: 17px; margin-top: 5px; }
  .footer-sign { margin-top: 20px; padding-top: 10px; border-top: 2px solid #b4541f; display:flex; gap: 26px; break-inside: avoid; }
  .footer-sign .sf { flex:1; }
  .footer-sign .sf .fill { margin-top: 18px; }
  .footer-sign .cap { font-size: 9pt; color: #555; }
  .pagebreak { break-before: page; page-break-before: always; }
`;

function renderOptions(q, multi) {
  const opts = (q.options || []).slice();
  const dkLabel = q.hasDontKnow ? 'Nem tudom' : null;
  const allTexts = opts.concat(dkLabel ? [dkLabel] : []);
  const useCols = allTexts.length >= 4 && allTexts.every((o) => o.length <= 44);
  let html = `<div class="opts${useCols ? ' cols2' : ''}">`;
  for (const o of opts) html += `<label class="opt"><span class="box"></span> ${esc(o)}</label>`;
  if (dkLabel) html += `<label class="opt dk"><span class="box"></span> ${esc(dkLabel)}</label>`;
  html += `</div>`;
  return html;
}

const MULTI_RE = /\s*\(\s*több is jelölhető\s*\)\s*/gi;

function renderQuestion(q, num) {
  const multi = q.type === 'multi';
  // a szintézis néha a kérdés szövegébe is beleírta a "(Több is jelölhető)"-t → kivesszük, hogy ne duplázódjon
  let text = String(q.text || '').replace(MULTI_RE, ' ').replace(/\s{2,}/g, ' ').trim();
  let hint = q.hint && q.hint.trim() ? q.hint.trim().replace(MULTI_RE, ' ').replace(/\s{2,}/g, ' ').trim() : '';
  if (multi && !/több is jelölhet/i.test(hint) && !/több is jelölhet/i.test(text)) {
    hint = hint ? `${hint} · több is jelölhető` : 'több is jelölhető';
  }
  let html = `<div class="q"><p class="qt"><span class="num">${num}.</span> ${esc(text)}`;
  if (hint) html += ` <span class="hint">(${esc(hint)})</span>`;
  html += `</p>`;

  if (q.type === 'text') {
    const n = Math.max(1, Math.min(3, q.textLines || 2));
    html += `<div class="lines">${'<div class="ln"></div>'.repeat(n)}</div>`;
  } else {
    html += renderOptions(q, multi);
  }

  if (q.hasOther) {
    const label = q.otherLabel && q.otherLabel.trim() ? q.otherLabel.trim() : 'Egyéb';
    html += `<div class="other">${esc(label)}: <span class="oline"></span></div>`;
  }
  html += `</div>`;
  return html;
}

const sections = doc.sections || [];
const questions = doc.questions || [];
const meta = doc.meta || {};
const TITLE = meta.title || '3D virtuális bemutatótér — felmérő kérdőív';
const SUBTITLE = meta.subtitle || 'Építőipari cég elkészült munkáinak online, 3D-s bemutatásához. Ez az adatlap segít, hogy pontos ajánlatot és tervet készíthessünk.';
const HOWTO = meta.howto || '<b>Kitöltési útmutató.</b> Kérjük, a megfelelő válasznál tegyen egy <span class="legendbox x"></span> jelet az üres négyzetbe <span class="legendbox"></span>. Ahol jelezzük, több válasz is jelölhető. Ha egyik felkínált válasz sem pontos, írja be sajátját az „Egyéb" sorba. Amit nem tud, hagyja üresen vagy jelölje a „Nem tudom" lehetőséget — a végén átbeszéljük. Az utolsó, <b>E</b> szakaszt kérjük a cég <b>rendszergazdája / IT-felelőse</b> töltse ki.';

let body = '';
let num = 0;
sections.forEach((sec, i) => {
  const pageBreak = (sec.pageBreak === true || sec.key === 'E') ? ' pagebreak' : '';
  body += `<div class="section${pageBreak}">`;
  const head = (sec.key && String(sec.key).trim()) ? `${esc(sec.key)}. ${esc(sec.title)}` : esc(sec.title);
  body += `<div class="section-head"><span class="stitle">${head}</span><span class="swho">${esc(sec.who)}</span></div>`;
  const secKey = (sec.key || '').trim().toUpperCase();
  const secTitle = (sec.title || '').trim().toUpperCase();
  const qs = questions.filter((q) => {
    const s = (q.section || '').trim().toUpperCase();
    return (secKey && s === secKey) || s === secTitle;
  });
  for (const q of qs) {
    num += 1;
    body += renderQuestion(q, num);
  }
  body += `</div>`;
});

const html = `<!DOCTYPE html>
<html lang="hu"><head><meta charset="UTF-8"><title>3D bemutatótér – felmérő kérdőív</title><style>${CSS}</style></head>
<body>
  <div class="cover">
    <h1>${TITLE}</h1>
    <p class="sub">${SUBTITLE}</p>
    <div class="meta-row">
      <div class="meta-field"><span class="lbl">Cég neve</span><span class="fill"></span></div>
      <div class="meta-field"><span class="lbl">Kitöltő neve / beosztása</span><span class="fill"></span></div>
    </div>
    <div class="meta-row">
      <div class="meta-field"><span class="lbl">Telefon / e-mail</span><span class="fill"></span></div>
      <div class="meta-field"><span class="lbl">Kitöltés dátuma</span><span class="fill"></span></div>
    </div>
  </div>
  <div class="howto">${HOWTO}</div>
  ${body}
  <div class="footer-sign">
    <div class="sf"><div class="cap">Kitöltő aláírása</div><div class="fill"></div></div>
    <div class="sf"><div class="cap">Dátum</div><div class="fill"></div></div>
  </div>
</body></html>`;

fs.writeFileSync(outPath, html);
console.log(`HTML written: ${outPath} (${html.length} bytes), ${num} questions across ${sections.length} sections`);
