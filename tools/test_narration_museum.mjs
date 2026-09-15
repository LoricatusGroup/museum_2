import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const MIME = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.png':'image/png'};
function wavBuf(sec){
  const sr=8000, n=sr*sec, b=Buffer.alloc(44+n*2);
  b.write('RIFF',0); b.writeUInt32LE(36+n*2,4); b.write('WAVE',8); b.write('fmt ',12);
  b.writeUInt32LE(16,16); b.writeUInt16LE(1,20); b.writeUInt16LE(1,22);
  b.writeUInt32LE(sr,24); b.writeUInt32LE(sr*2,28); b.writeUInt16LE(2,32); b.writeUInt16LE(16,34);
  b.write('data',36); b.writeUInt32LE(n*2,40);
  return b;
}
const AUDIO = wavBuf(60);   // hosszú, hogy a kattintások késése ne érje el a végét
const srv = http.createServer((req,res)=>{
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__a.wav' || u === '/__b.wav') {
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
      const start = m[1] ? parseInt(m[1],10) : 0;
      const end = m[2] ? parseInt(m[2],10) : AUDIO.length-1;
      res.writeHead(206, {'Content-Type':'audio/wav','Accept-Ranges':'bytes',
        'Content-Range':'bytes '+start+'-'+end+'/'+AUDIO.length, 'Content-Length': end-start+1,
        'Access-Control-Allow-Origin':'*'});
      return res.end(AUDIO.slice(start,end+1));
    }
    res.writeHead(200, {'Content-Type':'audio/wav','Accept-Ranges':'bytes','Content-Length':AUDIO.length,'Access-Control-Allow-Origin':'*'});
    return res.end(AUDIO);
  }
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, {'Content-Type': MIME[path.extname(f)] || 'application/octet-stream'});
  res.end(fs.readFileSync(f));
});
await new Promise((res,rej)=>{srv.once('error',rej); srv.listen(0,res);});
const PORT = srv.address().port;

const VTT = `WEBVTT

00:00:00.000 --> 00:00:02.000
Üdvözöllek a múzeumban.

00:00:02.000 --> 00:00:04.000
Ez a második felirat<i> dőlt taggel</i>.

2
00:00:04.000 --> 00:00:06.000
Harmadik sor.`;

const NARR = [
  {slug:'intro', lang:'hu', title:'Bevezető – a múzeumról', subtitle:'Rövid köszöntő', audio_url:'http://127.0.0.1:'+PORT+'/__a.wav', duration_sec:60, captions:VTT, floor:0, wing:'lobby', is_intro:true, sort_order:0},
  {slug:'intro', lang:'en', title:'Introduction – about the museum', subtitle:'A short welcome', audio_url:'http://127.0.0.1:'+PORT+'/__b.wav', duration_sec:60, captions:'WEBVTT\n\n00:00:00.000 --> 00:00:30.000\nWelcome to the museum.', floor:0, wing:'lobby', is_intro:true, sort_order:0},
  {slug:'north', lang:'hu', title:'Északi szárny', subtitle:null, audio_url:'http://127.0.0.1:'+PORT+'/__a.wav', duration_sec:60, captions:'Ez sima átirat, nincs benne időbélyeg.', floor:0, wing:'north', is_intro:false, sort_order:1},
  {slug:'level2', lang:'hu', title:'Fénycsarnok', subtitle:'2. emelet', audio_url:'http://127.0.0.1:'+PORT+'/__a.wav', duration_sec:60, captions:null, floor:2, wing:null, is_intro:false, sort_order:0},
];

const browser = await puppeteer.launch({
  executablePath:'/opt/pw-browsers/chromium',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--mute-audio']
});
const page = await browser.newPage();
page.setDefaultTimeout(8000);
await page.setViewport({width:1280,height:800});
const logs=[]; page.on('console',m=>logs.push(m.type()+': '+m.text()));
page.on('pageerror',e=>logs.push('PAGEERROR: '+e.message));
page.on('response',r=>{ if(r.status()>=400) logs.push('HTTP '+r.status()+' '+r.url().replace('http://127.0.0.1:'+PORT+'','')); });

await page.evaluateOnNewDocument(()=>{ Object.defineProperty(navigator,'language',{get:()=>'hu-HU'}); Object.defineProperty(navigator,'languages',{get:()=>['hu-HU','hu']}); });
await page.setRequestInterception(true);
page.on('request', req => {
  const u = req.url();
  if (u.includes('supabase.co')) {
    if (req.method()==='OPTIONS') return req.respond({status:204, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
    const body = u.includes('/narrations') ? NARR : [];
    return req.respond({status:200, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body: JSON.stringify(body)});
  }
  req.continue();
});

await page.goto('http://127.0.0.1:'+PORT+'/', {waitUntil:'domcontentloaded', timeout:60000});
await page.waitForFunction(()=>typeof window.camera!=='undefined', {timeout:30000}).catch(e=>console.log('WARN: camera nem jött létre'));
await new Promise(r=>setTimeout(r,1500));

const step = async (name, fn) => { const r = await fn(); console.log((r.ok?'✅':'❌')+' '+name+(r.msg?' — '+r.msg:'')); return r.ok; };
let fails = 0;
const check = async (n,f)=>{ if(!(await step(n,f))) fails++; };

await check('narráció-gomb belépés ELŐTT rejtve', async () => {
  const d = await page.$eval('#narr-btn', e => getComputedStyle(e).display);
  return {ok: d==='none', msg: 'display='+d};
});

await page.click('#startBtn');
await new Promise(r=>setTimeout(r,600));

await check('narráció-gomb belépés UTÁN látszik', async () => {
  const d = await page.$eval('#narr-btn', e => getComputedStyle(e).display);
  return {ok: d==='block', msg: 'display='+d};
});

await check('egyszeri felajánlás megjelenik', async () => {
  const v = await page.$eval('#narr-offer', e => e.hidden ? null : e.innerText.replace(/\n/g,' | '));
  return {ok: !!v, msg: v};
});

await check('„Most nem” elrejti és megjegyzi', async () => {
  await page.click('#narr-offer-no');
  const hid = await page.$eval('#narr-offer', e => e.hidden);
  const ls = await page.evaluate(()=>localStorage.getItem('museumNarrOffer'));
  return {ok: hid && ls==='seen', msg: 'hidden='+hid+' ls='+ls};
});

await check('panel nyílik, 3 sáv (slug-onként egy)', async () => {
  await page.click('#narr-btn');
  await new Promise(r=>setTimeout(r,400));
  const n = await page.$$eval('#narr-list .narr-track', els => els.map(e=>e.innerText.replace(/\n/g,' / ')));
  const shown = await page.$eval('#narr-panel', e => e.getBoundingClientRect().left);
  return {ok: n.length===3 && shown>=0, msg: n.length+' sáv, left='+shown+' :: '+JSON.stringify(n)};
});

await check('intro elöl, emelet-címke stimmel', async () => {
  const first = await page.$eval('#narr-list .narr-track', e => e.innerText);
  return {ok: /Bevezető/.test(first) && /FSZT/.test(first) && /Aula/.test(first), msg: JSON.stringify(first)};
});

await check('lejátszás indul, időzített felirat megjelenik', async () => {
  await page.evaluate(()=>document.querySelectorAll('#narr-list .narr-track')[0].click());
  await page.waitForFunction(()=>narrAudio && narrAudio.readyState >= 2, {timeout:8000});
  const playing = await page.evaluate(()=>!!(window.narrAudio && !narrAudio.paused));
  await page.evaluate(()=>{ narrAudio.pause(); narrAudio.currentTime = 0.5; });
  await page.waitForFunction(()=>Math.abs(narrAudio.currentTime-0.5)<0.15, {timeout:5000});
  await new Promise(r=>setTimeout(r,250));
  const cc = await page.$eval('#narr-cc', e => getComputedStyle(e).display==='none' ? null : e.textContent);
  return {ok: playing && cc && /Üdvözöllek/.test(cc), msg: 'playing='+playing+' cc='+JSON.stringify(cc)};
});

await check('a felirat vált a 2. cue-ra, HTML-tag nélkül', async () => {
  await page.evaluate(()=>{ narrAudio.pause(); narrAudio.currentTime = 2.5; });
  await page.waitForFunction(()=>Math.abs(narrAudio.currentTime-2.5)<0.15, {timeout:5000});
  await new Promise(r=>setTimeout(r,250));
  const cc = await page.$eval('#narr-cc', e => e.textContent);
  return {ok: /második felirat dőlt taggel/.test(cc) && !/[<>]/.test(cc), msg: JSON.stringify(cc)};
});

await check('CC gomb kikapcsolja a feliratot', async () => {
  await page.evaluate(()=>{ narrAudio.pause(); narrAudio.currentTime = 2.5; narrTick(); });
  await page.click('#narr-cc-btn');
  await new Promise(r=>setTimeout(r,300));
  const d = await page.$eval('#narr-cc', e => getComputedStyle(e).display);
  await page.click('#narr-cc-btn');
  await new Promise(r=>setTimeout(r,300));
  const d2 = await page.$eval('#narr-cc', e => getComputedStyle(e).display);
  return {ok: d==='none' && d2!=='none', msg: 'ki='+d+' be='+d2};
});

await check('szünet/folytatás gomb', async () => {
  await page.evaluate(()=>{ narrAudio.currentTime = 0.5; narrAudio.play(); });
  await new Promise(r=>setTimeout(r,300));
  await page.click('#narr-play');                       // szünet
  const p1 = await page.evaluate(()=>narrAudio.paused);
  // ismert pozíció, majd: szünetben KINT MARAD-e a felirat?
  await page.evaluate(()=>{ narrAudio.currentTime = 0.5; });
  await page.waitForFunction(()=>Math.abs(narrAudio.currentTime-0.5)<0.15, {timeout:5000});
  await new Promise(r=>setTimeout(r,250));
  const ccStays = await page.$eval('#narr-cc', e=>getComputedStyle(e).display!=='none');
  await page.click('#narr-play');                       // folytatás
  await new Promise(r=>setTimeout(r,400));
  const p2 = await page.evaluate(()=>narrAudio.paused);
  return {ok: p1===true && p2===false && ccStays, msg: 'szünet='+p1+' folytatás-fut='+!p2+' felirat-marad-szünetben='+ccStays};
});

await check('±15 mp gombok', async () => {
  await page.evaluate(()=>{narrAudio.pause(); narrAudio.currentTime=3;});
  await page.waitForFunction(()=>Math.abs(narrAudio.currentTime-3)<0.2, {timeout:5000});
  await page.evaluate(()=>document.querySelector('[data-narr="back"]').click());
  const a = await page.evaluate(()=>narrAudio.currentTime);
  await page.evaluate(()=>document.querySelector('[data-narr="fwd"]').click());
  const b = await page.evaluate(()=>narrAudio.currentTime);
  return {ok: a===0 && Math.abs(b-15)<0.6, msg: 'vissza→'+a.toFixed(2)+' előre→'+b.toFixed(2)+' (hossz 60)'};
});

await check('sima átirat (időbélyeg nélkül) nem dob feliratsávot', async () => {
  await page.evaluate(()=>document.querySelectorAll('#narr-list .narr-track')[1].click());
  await new Promise(r=>setTimeout(r,700));
  const cc = await page.$eval('#narr-cc', e => getComputedStyle(e).display);
  const tr = await page.$eval('#narr-tr-body', e => e.textContent);
  const trHidden = await page.$eval('#narr-tr', e => e.hidden);
  return {ok: cc==='none' && !trHidden && /sima átirat/.test(tr), msg: 'cc='+cc+' átirat='+JSON.stringify(tr.slice(0,40))};
});

await check('felirat nélküli sávnál nincs átirat-blokk', async () => {
  await page.evaluate(()=>document.querySelectorAll('#narr-list .narr-track')[2].click());
  await new Promise(r=>setTimeout(r,400));
  const trHidden = await page.$eval('#narr-tr', e => e.hidden);
  return {ok: trHidden, msg: 'hidden='+trHidden};
});

await check('nyelvváltás: EN sáv, EN felirat, játszik tovább', async () => {
  await page.evaluate(()=>document.querySelectorAll('#narr-list .narr-track')[0].click());
  await new Promise(r=>setTimeout(r,500));
  await page.click('#lang-switch [data-lang="en"]');
  await new Promise(r=>setTimeout(r,900));
  const title = await page.$eval('#narr-now-title', e => e.textContent);
  const note = await page.$eval('#narr-note', e => e.textContent);
  const cc = await page.$eval('#narr-cc', e => e.textContent);
  const rows = await page.$$eval('#narr-list .narr-track .nm', els => els.map(e=>e.textContent));
  const diag = await page.evaluate(()=>({ct:+narrAudio.currentTime.toFixed(2), idx:narrCueIdx, ccOn:narrCcOn,
    cues:narrCues?narrCues.length:null, paused:narrAudio.paused, lang:narrCur&&narrCur.lang}));
  return {ok: /about the museum/.test(title) && /You pick the track/.test(note) && /Welcome to the museum/.test(cc) && /North wing|Északi/.test(rows.join(' ')),
          msg: JSON.stringify({title, cc, rows})+' diag='+JSON.stringify(diag)};
});

await check('hiányzó EN fordítás magyarra esik vissza', async () => {
  const rows = await page.$$eval('#narr-list .narr-track .nm', els => els.map(e=>e.textContent));
  return {ok: rows.length===3 && rows.some(r=>/Fénycsarnok/.test(r)), msg: JSON.stringify(rows)};
});

await page.click('#lang-switch [data-lang="hu"]');
await new Promise(r=>setTimeout(r,500));

await check('némítás a narrációra is hat', async () => {
  await page.click('#mute-btn');
  const m1 = await page.evaluate(()=>narrAudio.muted);
  await page.click('#mute-btn');
  const m2 = await page.evaluate(()=>narrAudio.muted);
  return {ok: m1===true && m2===false, msg: 'némítva='+m1+' vissza='+m2};
});

await check('a panelen a nyilak nem indítanak járást', async () => {
  const before = await page.evaluate(()=>({x:camera.position.x,z:camera.position.z}));
  await page.focus('#narr-seek');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await new Promise(r=>setTimeout(r,500));
  const after = await page.evaluate(()=>({x:camera.position.x,z:camera.position.z}));
  const moved = Math.hypot(after.x-before.x, after.z-before.z);
  return {ok: moved < 0.05, msg: 'elmozdulás='+moved.toFixed(3)};
});

await check('panelen kívül a WASD továbbra is mozgat', async () => {
  await page.evaluate(()=>document.getElementById('narr-x').click());
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>{ if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  const before = await page.evaluate(()=>({x:camera.position.x,z:camera.position.z}));
  await page.keyboard.down('KeyW');
  await new Promise(r=>setTimeout(r,600));
  await page.keyboard.up('KeyW');
  const after = await page.evaluate(()=>({x:camera.position.x,z:camera.position.z}));
  const moved = Math.hypot(after.x-before.x, after.z-before.z);
  return {ok: moved > 0.5, msg: 'elmozdulás='+moved.toFixed(2)};
});

await check('minimap kattintás mozgat (pointer-events javítás)', async () => {
  const before = await page.evaluate(()=>({x:camera.position.x,z:camera.position.z}));
  const box = await page.$eval('#minimap', e => { const r=e.getBoundingClientRect(); return {x:r.left+r.width*0.5, y:r.top+r.height*0.62}; });
  await page.mouse.click(box.x, box.y);
  await new Promise(r=>setTimeout(r,1400));
  const after = await page.evaluate(()=>({x:camera.position.x,z:camera.position.z}));
  const moved = Math.hypot(after.x-before.x, after.z-before.z);
  return {ok: moved > 0.5, msg: 'elmozdulás='+moved.toFixed(2)};
});

await check('videó megnyitása szünetelteti a narrációt', async () => {
  await page.evaluate(()=>{ narrPanelOpen(true); });
  // a már kiválasztott sávra kattintás VÁLTÓ (szünet/folytatás) — itt biztosra megyünk
  await page.evaluate(()=>{ if (narrAudio.paused) narrPlay(); });
  await page.waitForFunction(()=>!narrAudio.paused, {timeout:5000}).catch(()=>{});
  const p0 = await page.evaluate(()=>narrAudio.paused);
  await page.evaluate(url=>openArt({userData:{isMedia:true, mediaKind:'video', mediaUrl:url, title:'teszt', artist:''}, position:{x:0,y:0,z:0}}), 'http://127.0.0.1:'+PORT+'/__a.wav');
  await new Promise(r=>setTimeout(r,400));
  const p1 = await page.evaluate(()=>narrAudio.paused);
  const panel = await page.$eval('#narr-panel', e => e.classList.contains('show'));
  await page.evaluate(()=>closeArt());
  return {ok: p0===false && p1===true && !panel, msg: 'előtte-játszik='+!p0+' utána-szünet='+p1+' panel-zárva='+!panel};
});

await check('nincs JS hiba a konzolon', async () => {
  const bad = logs.filter(l => /PAGEERROR/.test(l) || (/^HTTP/.test(l) && !/favicon/.test(l)));
  return {ok: bad.length===0, msg: bad.join(' ¦ ') || 'tiszta'};
});

// mobil elrendezés
const m = await browser.newPage();
await m.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
await m.evaluateOnNewDocument(()=>{ Object.defineProperty(navigator,'language',{get:()=>'hu-HU'}); });
await m.setRequestInterception(true);
m.on('request', req => {
  const u = req.url();
  if (u.includes('supabase.co')) {
    if (req.method()==='OPTIONS') return req.respond({status:204, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,authorization,content-type'}});
    return req.respond({status:200, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}, body: JSON.stringify(u.includes('/narrations')?NARR:[])});
  }
  req.continue();
});
await m.goto('http://127.0.0.1:'+PORT+'/', {waitUntil:'domcontentloaded'});
await new Promise(r=>setTimeout(r,1200));
await m.evaluate(()=>{ try{localStorage.setItem('museumNarrOffer','seen');}catch(e){} });
await m.click('#startBtn');
await new Promise(r=>setTimeout(r,600));
await m.evaluate(()=>narrPanelOpen(true));
await new Promise(r=>setTimeout(r,400));
await m.evaluate(()=>document.querySelectorAll('#narr-list .narr-track')[0].click());
await new Promise(r=>setTimeout(r,600));

await check('mobil: alsó lap, nincs vízszintes túlcsordulás', async () => {
  const r = await m.$eval('#narr-panel', e => { const b=e.getBoundingClientRect(); return {l:b.left,w:b.width,t:b.top,h:b.height}; });
  const doc = await m.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  return {ok: Math.abs(r.l)<1 && Math.abs(r.w-390)<1 && r.t>200 && doc.sw<=doc.cw+1,
          msg: JSON.stringify(r)+' scrollW='+doc.sw+'/'+doc.cw};
});
await check('mobil: gombok elérik a 38px-es tapintási méretet', async () => {
  const hs = await m.$$eval('#narr-ctl button, .narr-track', els => els.map(e=>Math.round(e.getBoundingClientRect().height)));
  return {ok: hs.every(h=>h>=36), msg: JSON.stringify(hs)};
});

await m.screenshot({path:(process.env.SHOT_DIR || '/tmp') + '/narr-mobile.png'});
await page.evaluate(()=>{narrPanelOpen(true); narrAudio && narrAudio.play();});
await new Promise(r=>setTimeout(r,700));
await page.screenshot({path:(process.env.SHOT_DIR || '/tmp') + '/narr-desktop.png'});

await browser.close(); srv.close();
console.log(fails ? '\n'+fails+' teszt BUKOTT' : '\nMinden teszt átment.');
process.exit(fails?1:0);
