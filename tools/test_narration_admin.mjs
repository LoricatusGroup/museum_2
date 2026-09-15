import puppeteer from 'puppeteer';
import http from 'http'; import fs from 'fs'; import path from 'path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.png':'image/png'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
 if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('nf');}
 r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f));});
await new Promise((res,rej)=>{srv.once('error',rej);srv.listen(0,res);});
const PORT = srv.address().port;

// A jövőbeli lejáratú, aláíratlan JWT elég: az admin csak a payloadot olvassa ki belőle.
const jwt = 'x.' + Buffer.from(JSON.stringify({email:'teszt@pelda.hu', exp: Math.floor(Date.now()/1000)+99999})).toString('base64url') + '.y';

let NARR = [
  {id:'n1', slug:'intro', lang:'hu', title:'Bevezető – a múzeumról', subtitle:'Rövid köszöntő',
   audio_url:'https://kdvyewzykodtyqxgnnxa.supabase.co/storage/v1/object/public/media/narration/intro/hu-1.mp3',
   audio_path:'narration/intro/hu-1.mp3', duration_sec:134, file_size:2100000,
   captions:'WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nÜdvözöljük.', floor:0, wing:'lobby', is_intro:true, sort_order:0, is_published:true},
  {id:'n2', slug:'intro', lang:'en', title:'Introduction', subtitle:null,
   audio_url:'https://kdvyewzykodtyqxgnnxa.supabase.co/storage/v1/object/public/media/narration/intro/en-1.mp3',
   audio_path:'narration/intro/en-1.mp3', duration_sec:130, file_size:2000000,
   captions:null, floor:0, wing:'lobby', is_intro:true, sort_order:0, is_published:false},
  {id:'n3', slug:'eszaki-szarny', lang:'hu', title:'Északi szárny', subtitle:null,
   audio_url:null, audio_path:null, duration_sec:null, file_size:null,
   captions:'Sima átirat.', floor:1, wing:'north', is_intro:false, sort_order:1, is_published:true}
];
const calls = [];

const browser = await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
const page = await browser.newPage();
page.setDefaultTimeout(8000);
await page.setViewport({width:1280,height:900});
const logs=[]; page.on('pageerror',e=>logs.push('PAGEERROR: '+e.message));
page.on('response',r=>{ if(r.status()>=400) logs.push('HTTP '+r.status()+' '+r.url().replace('http://127.0.0.1:'+PORT+'','')); });

await page.setRequestInterception(true);
page.on('request', req => {
  const u = req.url(), m = req.method();
  if (!u.includes('supabase.co')) return req.continue();
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,authorization,content-type,prefer,x-upsert','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Expose-Headers':'*'};
  if (m==='OPTIONS') return req.respond({status:204, headers:cors});
  const json = (b,st)=>req.respond({status:st||200, headers:Object.assign({'Content-Type':'application/json'},cors), body:JSON.stringify(b)});
  let post = null;
  try { post = req.postData() ? JSON.parse(req.postData()) : null; } catch(e) { post = '(bináris)'; }
  calls.push({m, u: u.replace('https://kdvyewzykodtyqxgnnxa.supabase.co',''), post});

  if (u.includes('/auth/v1/token')) return json({access_token:jwt, refresh_token:'r'});
  if (u.includes('/rest/v1/narrations')) {
    if (m==='GET') return json(NARR);
    if (m==='POST') { const row=Object.assign({id:'new'+(NARR.length+1)}, post); NARR.push(row); return json([row], 201); }
    if (m==='PATCH') {
      const id=(u.match(/id=eq\.([^&]+)/)||[])[1];
      NARR = NARR.map(n=>n.id===id?Object.assign({},n,post):n);
      return json([], 204);
    }
    if (m==='DELETE') {
      const id=(u.match(/id=eq\.([^&]+)/)||[])[1], slug=(u.match(/slug=eq\.([^&]+)/)||[])[1];
      NARR = NARR.filter(n => id ? n.id!==id : n.slug!==decodeURIComponent(slug||''));
      return json([], 204);
    }
  }
  if (u.includes('/rest/v1/exhibits')) return json([]);
  if (u.includes('/rest/v1/app_settings')) return json([]);
  if (u.includes('/storage/v1/object')) return json({Key:'ok'});
  if (u.includes('/functions/v1/')) return json({ok:true});
  return json([]);
});

await page.goto('http://127.0.0.1:'+PORT+'/admin.html', {waitUntil:'domcontentloaded', timeout:60000});
await page.type('#email','teszt@pelda.hu');
await page.type('#password','titok');
await page.click('#login-btn');
await new Promise(r=>setTimeout(r,1200));

let fails=0;
const check = async (name, fn) => {
  let r; try { r = await fn(); } catch(e){ r = {ok:false, msg:'kivétel: '+e.message}; }
  console.log((r.ok?'✅':'❌')+' '+name+(r.msg?' — '+r.msg:''));
  if(!r.ok) fails++;
};

await check('a Narráció fül létezik és váltható', async () => {
  await page.click('#tab-narr');
  await new Promise(r=>setTimeout(r,300));
  const act = await page.$eval('#view-narr', e=>e.classList.contains('active'));
  const other = await page.$eval('#view-items', e=>e.classList.contains('active'));
  return {ok: act && !other, msg:'narr-aktív='+act+' items-aktív='+other};
});

await check('2 sáv-kártya (slug szerint csoportosítva)', async () => {
  const n = await page.$$eval('#narr-list .ncard', e=>e.length);
  const txt = await page.$$eval('#narr-list .ncard .main', e=>e.map(x=>x.innerText.replace(/\n/g,' / ')));
  return {ok: n===2, msg: n+' kártya :: '+JSON.stringify(txt)};
});

await check('nyelvi pirulák állapota helyes (HU él, EN vázlat, IT hiányzik)', async () => {
  const p = await page.$$eval('#narr-list .ncard:first-child .lpill', e=>e.map(x=>x.textContent.trim()+'|'+x.className.replace('lpill','').trim()));
  return {ok: p[0]==='HU ✓|has' && p[1]==='EN ✓|draft' && p[2]==='IT +|', msg: JSON.stringify(p)};
});

await check('hang nélküli sáv: nincs meghallgatás, „vázlat” címke', async () => {
  const dis = await page.$eval('#narr-list .ncard:nth-child(2) .play', e=>e.disabled);
  const badge = await page.$eval('#narr-list .ncard:nth-child(2) .badges', e=>e.innerText.trim());
  return {ok: dis && /vázlat/.test(badge), msg:'tiltott='+dis+' címke='+JSON.stringify(badge)};
});

await check('meglévő sáv szerkesztése: a mezők kitöltve, a nyelv zárolva', async () => {
  await page.click('#narr-list .ncard:first-child [data-nedit]');
  await new Promise(r=>setTimeout(r,300));
  const v = await page.evaluate(()=>({
    title: document.getElementById('n-title').value,
    sub: document.getElementById('n-sub').value,
    lang: document.getElementById('n-lang').value,
    langLocked: document.getElementById('n-lang').disabled,
    floor: document.getElementById('n-floor').value,
    wing: document.getElementById('n-wing').value,
    intro: document.getElementById('n-intro').checked,
    pub: document.getElementById('n-pub').checked,
    cap: document.getElementById('n-cap').value.slice(0,20),
    del: getComputedStyle(document.getElementById('n-del')).display,
    info: document.getElementById('n-cap-info').textContent
  }));
  return {ok: v.title==='Bevezető – a múzeumról' && v.lang==='hu' && v.langLocked && v.wing==='lobby'
    && v.intro && v.pub && v.del!=='none' && /1 időzített felirat/.test(v.info), msg: JSON.stringify(v)};
});

await check('WebVTT-ellenőrzés: hibás időbélyegre figyelmeztet', async () => {
  await page.evaluate(()=>{ const t=document.getElementById('n-cap'); t.value='blabla --> bla'; t.dispatchEvent(new Event('input')); });
  const a = await page.$eval('#n-cap-info', e=>[e.textContent, e.className]);
  await page.evaluate(()=>{ const t=document.getElementById('n-cap'); t.value='Csak sima szöveg.'; t.dispatchEvent(new Event('input')); });
  const b = await page.$eval('#n-cap-info', e=>[e.textContent, e.className]);
  return {ok: /egyetlen időbélyeg sem/.test(a[0]) && /vtt-warn/.test(a[1]) && /álló átiratként/.test(b[0]),
          msg: JSON.stringify(a[0].slice(0,50))+' || '+JSON.stringify(b[0].slice(0,40))};
});

await check('mentés PATCH-et küld a helyes mezőkkel', async () => {
  calls.length = 0;
  await page.evaluate(()=>{ document.getElementById('n-sub').value='Új alcím'; document.getElementById('n-pub').checked=false; });
  await page.click('#nmodal-save');
  await new Promise(r=>setTimeout(r,700));
  const patch = calls.filter(c=>c.m==='PATCH' && c.u.includes('/narrations'))[0];
  const closed = await page.$eval('#nmodal-bg', e=>!e.classList.contains('show'));
  return {ok: !!patch && patch.post.subtitle==='Új alcím' && patch.post.is_published===false
    && patch.post.slug==='intro' && patch.post.lang==='hu' && patch.u.includes('id=eq.n1') && closed,
    msg: patch ? JSON.stringify({url:patch.u, sub:patch.post.subtitle, pub:patch.post.is_published}) : 'nincs PATCH'};
});

await check('hiányzó nyelvi változat felvétele a pirulával (IT)', async () => {
  await page.click('#narr-list .ncard:first-child .lpill:nth-child(3)');
  await new Promise(r=>setTimeout(r,300));
  const v = await page.evaluate(()=>({
    title: document.getElementById('n-title').value,
    lang: document.getElementById('n-lang').value,
    slug: document.getElementById('n-slug').value,
    id: document.getElementById('n-id').value,
    floor: document.getElementById('n-floor').value,
    wing: document.getElementById('n-wing').value,     // a testvérnyelvből öröklődik
    intro: document.getElementById('n-intro').checked,
    heading: document.getElementById('nmodal-title').textContent,
    del: getComputedStyle(document.getElementById('n-del')).display
  }));
  return {ok: v.lang==='it' && v.slug==='intro' && !v.id && v.title==='' && v.wing==='lobby' && v.intro
    && /Új nyelvi változat/.test(v.heading) && v.del==='none', msg: JSON.stringify(v)};
});

await check('új nyelvi változat POST-tal jön létre, a slug megmarad', async () => {
  calls.length = 0;
  await page.evaluate(()=>{ document.getElementById('n-title').value='Introduzione'; });
  await page.click('#nmodal-save');
  await new Promise(r=>setTimeout(r,700));
  const post = calls.filter(c=>c.m==='POST' && c.u.includes('/narrations'))[0];
  return {ok: !!post && post.post.slug==='intro' && post.post.lang==='it' && post.post.title==='Introduzione',
    msg: post ? JSON.stringify(post.post).slice(0,120) : 'nincs POST'};
});

await check('új sáv: a címből ékezet nélküli azonosító lesz', async () => {
  calls.length = 0;
  await page.click('#narr-new');
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>{ document.getElementById('n-title').value='Déli szárny — Gépek és eszközök'; });
  await page.click('#nmodal-save');
  await new Promise(r=>setTimeout(r,700));
  const post = calls.filter(c=>c.m==='POST' && c.u.includes('/narrations'))[0];
  return {ok: !!post && post.post.slug==='deli-szarny-gepek-es-eszkozok' && post.post.lang==='hu',
    msg: post ? post.post.slug : 'nincs POST'};
});

await check('nem támogatott hangformátum elutasítva feltöltés előtt', async () => {
  calls.length = 0;
  await page.click('#narr-new');
  await new Promise(r=>setTimeout(r,300));
  await page.evaluate(()=>{ document.getElementById('n-title').value='Rossz formátum'; });
  const dt = await page.evaluateHandle(()=>{
    const f = new File([new Uint8Array([1,2,3])], 'hang.xyz', {type:''});
    const d = new DataTransfer(); d.items.add(f); return d;
  });
  await page.evaluate(d=>{ document.getElementById('n-file').files = d.files; }, dt);
  await page.click('#nmodal-save');
  await new Promise(r=>setTimeout(r,600));
  const up = calls.filter(c=>c.u.includes('/storage/'));
  const toastTxt = await page.$eval('#toasts', e=>e.innerText);
  const stillOpen = await page.$eval('#nmodal-bg', e=>e.classList.contains('show'));
  return {ok: up.length===0 && /Nem felismert hangformátum/.test(toastTxt) && stillOpen,
    msg: 'feltöltés='+up.length+' üzenet='+JSON.stringify(toastTxt.split('\n').pop())};
});

await check('MP3 feltöltése: Storage POST + helyes MIME + audio_url mentése', async () => {
  calls.length = 0;
  const dt = await page.evaluateHandle(()=>{
    const d = new DataTransfer();
    d.items.add(new File([new Uint8Array(1000)], 'narracio.mp3', {type:'audio/mpeg'}));
    return d;
  });
  await page.evaluate(d=>{ document.getElementById('n-file').files = d.files; }, dt);
  await page.click('#nmodal-save');
  await new Promise(r=>setTimeout(r,1500));
  const st = calls.filter(c=>c.u.includes('/storage/v1/object/media/'))[0];
  const post = calls.filter(c=>c.m==='POST' && c.u.includes('/narrations'))[0];
  const ct = st ? await page.evaluate(()=>1) : 0;
  return {ok: !!st && /\/narration\/rossz-formatum\/hu-\d+\.mp3$/.test(st.u) && !!post
      && post.post.mime_type==='audio/mpeg' && /\/storage\/v1\/object\/public\/media\/narration\//.test(post.post.audio_url),
    msg: (st?st.u:'nincs storage hívás')+' :: '+(post?JSON.stringify({mime:post.post.mime_type, size:post.post.file_size}):'nincs POST')};
});

await check('nyelvi változat törlése: a hangfájl is törlődik', async () => {
  calls.length = 0;
  page.once('dialog', d=>d.accept());
  await page.click('#narr-list .ncard:first-child [data-nedit]');
  await new Promise(r=>setTimeout(r,300));
  await page.click('#n-del');
  await new Promise(r=>setTimeout(r,800));
  const delObj = calls.filter(c=>c.m==='DELETE' && c.u.includes('/storage/'))[0];
  const delRow = calls.filter(c=>c.m==='DELETE' && c.u.includes('/narrations'))[0];
  return {ok: !!delObj && !!delRow && delObj.u.includes('narration/intro/hu-1.mp3') && delRow.u.includes('id=eq.n1'),
    msg: JSON.stringify({obj: delObj&&delObj.u, row: delRow&&delRow.u})};
});

await check('teljes sáv törlése minden nyelven', async () => {
  calls.length = 0;
  page.once('dialog', d=>d.accept());
  await page.click('#narr-list .ncard:first-child [data-ndelall]');
  await new Promise(r=>setTimeout(r,900));
  const delRow = calls.filter(c=>c.m==='DELETE' && c.u.includes('/narrations'))[0];
  return {ok: !!delRow && /slug=eq\./.test(delRow.u), msg: delRow ? delRow.u : 'nincs DELETE'};
});

await check('nincs JS hiba', async () => {
  const bad = logs.filter(l=>!/favicon/.test(l));
  return {ok: bad.length===0, msg: bad.join(' ¦ ') || 'tiszta'};
});

await page.click('#tab-narr');
await new Promise(r=>setTimeout(r,400));
await page.screenshot({path:(process.env.SHOT_DIR || '/tmp') + '/admin-narr.png'});

// mobil szélesség — a Narráció fülön mérjünk
await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
await new Promise(r=>setTimeout(r,300));
await page.click('#tab-narr');
await new Promise(r=>setTimeout(r,400));
await check('mobilon a nyelvi pirulák eltalálhatók (>=32px)', async () => {
  const hs = await page.$$eval('.lpill', e=>e.map(x=>Math.round(x.getBoundingClientRect().height)));
  return {ok: hs.length>0 && hs.every(h=>h>=32), msg: JSON.stringify(hs)};
});

await check('mobilon nincs vízszintes túlcsordulás', async () => {
  const d = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  return {ok: d.sw<=d.cw+1, msg:d.sw+'/'+d.cw};
});
await page.screenshot({path:(process.env.SHOT_DIR || '/tmp') + '/admin-narr-mobile.png'});

await browser.close(); srv.close();
console.log(fails ? '\n'+fails+' teszt BUKOTT' : '\nMinden admin teszt átment.');
process.exit(fails?1:0);
