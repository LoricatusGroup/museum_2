# Felmérési checklist — Webes 3D virtuális múzeum / kiállítótér projektek

**Készítette:** Loricatus szabadúszó fejlesztő részére · **Verzió:** 1.0 · **Alapja:** a `museum_2` referenciaprojekt teljes dimenzió-elemzése

---

## Mire való ez a dokumentum?

Ez egy **projektindítási felmérő (kick-off) checklist** webes 3D virtuális múzeum / kiállítótér megbízásokhoz. Célja, hogy a megbízás **legelején** — az árajánlat és a szerződés előtt — minden lényeges műszaki, jogi és üzemeltetési paramétert tisztázz a megrendelővel, így a munka **gyorsabb, kiszámíthatóbb és kevésbé vitatható** lesz.

**Hogyan használd:**
1. Először töltsd ki a **⚡ Gyors felmérés** szekciót egy beszélgetés/hívás alatt — ez ~10-12 döntő kérdés, amitől az ajánlat nagyságrendje függ.
2. A részletes szekciókat menet közben pipáld ki; minden sor egy kérdés vagy teendő. Az **Ajánlott:** sorok a `museum_2` tanulságaiból leszűrt alapértelmezések — ezektől csak indokkal térj el.
3. A megrendelői válaszokat írd a kijelölt helyre (`Válasz:` sorok / „Megrendelői válaszok" oszlop), hogy a felmérés egyben szerződési mellékletté váljon.
4. A **🚩 Tipikus buktatók** szekciót olvasd át a végén — ezek a leggyakoribb, drága hibák.

> **Miért hiteles ez a lista?** Minden pont egy valós, `museum_2`-ben megfigyelt problémából vagy döntésből ered (pl. mobil GPU fény-limit 131→7, „Unknown" licencek, relatív modell-URL miatti 404, fejlesztői vs. megrendelői fiók keveredése).

---

## ⚡ Gyors felmérés (1 oldal)

> A legkritikusabb kérdések. Ezek nélkül **ne adj árajánlatot.**

- [ ] **1. Hol fusson az éles oldal és ki üzemelteti?** Saját gép/VPS vs. felhő (GitHub Pages / Cloudflare Pages / Vercel / Netlify) vs. a megrendelő meglévő tárhelye. Ki a hosting felelőse átadás után?
  *(Statikus tartalomnál felhős PaaS bőven elég; saját szerver csak valódi backendhez kell.)* **Ajánlott:** Cloudflare Pages vagy GitHub Pages, a **megrendelő saját fiókjában**.
  `Válasz: ____________________`
- [ ] **2. Kinek a fiókjában/szervezetében legyen a repo és a hosting?** (A `museum_2`-ben a fejlesztőhöz, a LoricatusGroup szervezethez van kötve → átadási és lock-in kockázat.)
  **Ajánlott:** a **megrendelő** fiókja a tulajdonos, te meghívott collaborator/admin vagy.
  `Válasz: ____________________`
- [ ] **3. Van-e egyedi domain, vagy elég a `*.github.io` / `*.vercel.app` aldomain? Ki veszi meg és ki kezeli a DNS-t?**
  **Ajánlott:** egyedi (al)domain a **megrendelő nevén/számláján**, auto-renew bekapcsolva; te csak a rekordokat adod meg.
  `Válasz: ____________________`
- [ ] **4. Hány 3D tárgy lesz most és 6-12 hónap múlva? Mekkora egy modell átlag/max fájlmérete?**
  *(Ez dönti el a tárolást, a lazy load és CDN szükségességét.)* **Ajánlott terv:** 15-25 tárgy, max 3-5 MB/modell tömörítve.
  `Válasz: ____________________`
- [ ] **5. Honnan jönnek a 3D modellek?** Megrendelő adja / te modellezed / Sketchfab/store / fotogrammetria / AI image-to-3D.
  **Ajánlott:** a megrendelő adja a kész, jogtiszta GLB-ket.
  `Válasz: ____________________`
- [ ] **6. Ki szavatol a modellek jogtisztaságáért (licenc)?** *(A `museum_2`-ben mind a 18 modell License = „Unknown" — komoly jogi kockázat.)*
  **Ajánlott:** szerződésben a **megrendelő** szavatol és mentesít téged; csak CC0/CC-BY vagy megvásárolt licenc kerülhet élesbe.
  `Válasz: ____________________`
- [ ] **7. Milyen eszközökön kell elsősorban működnie?** Desktop / iOS Safari / Android Chrome / gyenge mobil / kioszk-tablet — és mi a prioritás?
  **Ajánlott:** mobil-first robusztusság, desktopon felfelé skálázott látvány.
  `Válasz: ____________________`
- [ ] **8. Mennyire legyen interaktív?** Csak séta + infó / kattintható zoom-forgatás / hotspotok-annotációk / vezetett túra-narráció-kvíz.
  **Ajánlott:** séta + közelség-infó + kattintható zoom/forgatás (a `museum_2` jelenlegi szintje jó alap).
  `Válasz: ____________________`
- [ ] **9. Egynyelvű vagy többnyelvű? Hány nyelv, ki fordít?** *(A `museum_2`-ben angol címek + magyar UI, i18n nélkül — utólag drága.)*
  **Ajánlott:** múzeumnál magyar+angol, az adatmodellt eleve nyelvenkénti mezőkkel tervezve.
  `Válasz: ____________________`
- [ ] **10. Közintézményi / pályázati pénzből készül-e?** Ha igen, valószínűleg **kötelező a WCAG akadálymentesség + impresszum + adatkezelési tájékoztató.**
  **Ajánlott:** tisztázd az elején; az AA-szintet külön tételként árazd.
  `Válasz: ____________________`
- [ ] **11. Árazási és fizetési modell?** Egyszeri fix díj / fix + havi karbantartás; előleg + mérföldkövek; mi az alap-scope és mi a felár.
  **Ajánlott:** fix díj + 30 napos jótállás + opcionális retainer; 40/30/30 mérföldkő-fizetés.
  `Válasz: ____________________`
- [ ] **12. Mi a határidő és ki/mikor szállítja a tartalmat (modellek + metaadat)?**
  **Ajánlott:** a tartalom-leadás külön mérföldkő; a megrendelői csúszás ne a te határidődet terhelje.
  `Válasz: ____________________`

---

## 1. 🌐 Hosting & üzemeltetés

- [ ] **Hol fusson a kész oldal?** GitHub Pages / Cloudflare Pages / Vercel / Netlify / megrendelő cPanel-tárhelye / VPS.
  *(Tisztán statikus tartalomhoz minden PaaS jó; nagy 3D forgalomnál a sávszélesség dönt.)* **Ajánlott:** Cloudflare Pages (kedvező sávszél + CDN) vagy GitHub Pages.
- [ ] **Ki birtokolja a repót és a hostingot átadás után?** *(A `museum_2` a fejlesztő szervezetében él, a commitok magánemailről jönnek → tulajdon keveredik.)* **Ajánlott:** megrendelő a tulajdonos, te collaborator.
- [ ] **Hol éljenek a nagy `.glb` assetek futásidőben?** Repóba commitolva / GitHub Release abszolút URL-lel / object storage (R2/S3/B2) + CDN / Git LFS.
  *(Ez a `museum_2` leggyengébb pontja — lásd buktatók.)* **Ajánlott:** Cloudflare R2 (egress-díjmentes) vagy GitHub Release **abszolút** URL-lel; soha ne relatív út.
- [ ] **Külső CDN-függőségek (three.js, GLTFLoader, Google Fonts) maradjanak CDN-en vagy self-hosted?**
  *(A `museum_2` cdnjs + jsdelivr + Google Fonts CDN-re épül, SRI és fallback nélkül — bármelyik kiesése megöli az oldalt.)* **Ajánlott:** kritikus libek + fontok **self-hosted, fix verzióval** (stabilitás + GDPR).
- [ ] **Kell-e staging / preview környezet a production mellett?** *(A `museum_2`-ben minden main push azonnal élesedik — egy hibás commit azonnal a látogató előtt.)* **Ajánlott:** PR/branch preview deploy (Vercel/Netlify/Cloudflare natívan tudja).
- [ ] **CI/CD modell:** ki indíthat deployt, marad-e a kettős GitHub Actions workflow, egyszerűsödik-e a pipeline.
- [ ] **Ki fizet a hostingért és a túllépésekért (sávszélesség, build-percek)?** **Ajánlott:** fizetős előfizetés a megrendelő nevén; te külön üzemeltetési/support díjat számlázol.
- [ ] **SLA / hibajavítási elvárás:** best-effort vs. garantált reakcióidő. **Ajánlott:** best-effort alap + opcionális fizetős support-csomag, írásban elhatárolva.
- [ ] **Backup / disaster recovery:** hol a forráskód és a **nyers** 3D assetek mentése a hosting-fiókon kívül?
  *(A `museum_2` CI törli a nyers GLB-ket a repóból → a Release az egyetlen másolat.)* **Ajánlott:** nyers GLB + meta.xlsx külön privát tárhelyen; havi automatikus archiválás.
- [ ] **Privát vagy publikus repo?** *(Privát repónál a GitHub Actions-percek korlátosak; publikusnál ingyen.)*
- [ ] **Be kell-e ágyazni (embed) a megrendelő meglévő weboldalába?** *(iframe esetén figyelni az `X-Frame-Options` / `Content-Security-Policy: frame-ancestors` fejlécre, valamint a fullscreen- és pointer-lock-viselkedésre beágyazva.)* **Ajánlott:** önálló oldal mint elsődleges, + opcionálisan engedélyezett iframe-beágyazás kizárólag a megrendelő domainjére.

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 2. 🔗 Domain, DNS, SSL

- [ ] **Kell-e egyedi domain, vagy elég az ingyenes `*.github.io`?** *(Project page esetén `/repo/` almappa → eltöri a relatív utakat.)* **Ajánlott:** demóra github.io; éles ügyfélprojektnél egyedi domain gyökéren.
- [ ] **Gyökér-domain (`pelda.hu`) vagy aldomain (`muzeum.pelda.hu`)?**
  *(Aldomain CNAME-mel triviális; apexhez GitHub Pages 4 db A-rekord + AAAA kell.)* **Ajánlott:** aldomain CNAME-mel, vagy apexnél Cloudflare DNS (ALIAS/apex flattening).
- [ ] **Ki a domain regisztrált tulajdonosa és kinek a nevén szól?** **Ajánlott:** a **megrendelő** regisztrátor-fiókjában, neked delegált hozzáférés.
- [ ] **Ki fizeti és figyeli a megújítást?** *(Lejárat → az egész oldal leáll.)* **Ajánlott:** megrendelő fizet, **auto-renew kötelező**, értesítések a megrendelő állandó címére + te is naptárazol.
- [ ] **Ki kezeli a DNS-zónát?** **Ajánlott:** Cloudflare-re delegált zóna, neked is (legalább ideiglenes) hozzáférés a gyors Pages-beállításhoz.
- [ ] **`Enforce HTTPS` + HTTP→HTTPS átirányítás beállítva?** *(WebGL/Web Audio/Fullscreen API biztonságos kontextust igényel.)* **Ajánlott:** kötelező; Cloudflare előtt „Full (strict)".
- [ ] **A CNAME fájl verziókezelve van a repóban?** *(A deploy a gyökeret — `path: '.'` — tölti fel, ezért a CNAME-nek a repóban kell lennie, különben az auto-commit lecsatlakoztathatja a domaint.)*
- [ ] **A relatív modell-URL-ek abszolútra állítva?** *(Domain/almappa-váltás eltöri a relatív `releases/download/...` utakat.)* **Ajánlott:** egyetlen jól definiált abszolút asset-bázis-URL.
- [ ] **www vs. nem-www kanonizálás iránya tisztázva?** **Ajánlott:** aldomainnél nem kérdés; apexnél apex a kanonikus, www→apex.
- [ ] **Szervezeti domain-verifikáció (TXT) bekapcsolva a domain-takeover ellen?** **Ajánlott:** szervezeti fióknál igen.
- [ ] **Kell-e email a domainen (`info@…`)?** *(Külön MX/SPF/DKIM/DMARC, NE keverd a Pages CNAME-mel.)* **Ajánlott:** alapból nincs scope-ban; ha kell, Zoho/Google Workspace, külön kezelt rekordok.

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 3. 🗿 3D assetek: formátum, méret, forrás, optimalizálás

- [ ] **Hány tárgy lesz most és 6-12 hónap múlva? Átlag/max fájlméret?** **Ajánlott:** 15-25 tárgy, max 3-5 MB/modell tömörítve, összesen <50 MB; efölött kötelező lazy load + CDN.
- [ ] **Honnan származnak a modellek?** Megrendelő / te modellezed / Sketchfab-store / fotogrammetria / AI image-to-3D. **Ajánlott:** jogtiszta forrás, írásban rögzített licenccel.
- [ ] **Kompressziós lánc rögzítve, ÉS a frontend loader támogatja-e?**
  *(KRITIKUS `museum_2`-hiba: a CI `gltfpack -cc -tc`-vel meshopt+KTX2-t gyárt, de a GLTFLoader nem kap MeshoptDecoder/KTX2Loader-t → egy valóban tömörített fájl némán nem töltődne be.)* **Ajánlott:** `gltfpack -cc -tc` + a frontendbe **bedrótozott** MeshoptDecoder és KTX2Loader; vagy maradj tömörítetlen/Draco GLB-nél, és NE használj `-cc -tc`-t.
- [ ] **Poly- és textúra-budget desktopra és mobilra külön?** **Ajánlott:** <50k háromszög/modell, max 2K textúra (mobilon 1K, KTX2).
- [ ] **Modell-URL feloldási stratégia:** relatív vs. abszolút Release/CDN URL. *(A keverék okozza a `museum_2` 404-jeit.)* **Ajánlott:** egységesen abszolút.
- [ ] **Betöltési stratégia:** minden egyszerre vs. lazy/distance-based + LoadingManager progressz-bar. **Ajánlott:** 10+ tárgynál lazy load + látható progressz + valódi (nem néma) hibakezelés.
- [ ] **Kell-e LOD (több részletességi szint)?** **Ajánlott:** csak nagyon nagy poly-számnál.
- [ ] **Textúra-stratégia és PBR-mélység:** beágyazott PNG vs. külső KTX2; csak baseColor vs. teljes metallic-roughness-normal-AO. **Ajánlott:** teljes PBR csak a kiemelt tárgyaknál; máshol baseColor + normal, KTX2-vel tömörítve.
- [ ] **Animációk kellenek-e?** *(A `museum_2` tree.glb-je valójában a Khronos Fox minta 3 animációval — felesleges súly.)* **Ajánlott:** statikus kiállításnál a build strip-elje az animációkat.
- [ ] **Export-konvenció a kurátornak (méret/orientáció/origó)?** *(A `museum_2` kódja Box3-mal normalizál 1.8 egységre — jó döntés, megtartandó.)*
- [ ] **Egy modell se legyen ~5 MB felett tömörítés után.**

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 4. 🎮 Frontend, render, interakció, hang

- [ ] **Build-rendszer:** marad-e a build nélküli egy-HTML megközelítés, vagy Vite/importmap modulokra bontva. *(A `museum_2` index.html + museum.html ~95%-ban duplikálódik.)* **Ajánlott:** kis projektnél maradhat build nélkül, de **egyetlen kanonikus oldal**, modern ESM three.js importmappal; nagyobbnál Vite.
- [ ] **three.js verzió és frissítési politika:** *(A `museum_2` r128-on, 2021-es, globál-script, EOL.)* **Ajánlott:** friss, konkrét verzióra **pinnelt** three.js ESM-mel; ne „latest".
- [ ] **3D-megjelenítési stratégia:** önhosztolt GLB vs. Sketchfab iframe vs. hibrid. *(A `museum_2` MINDKETTŐT tartalmazza → duplikáció, inkonzisztens élmény, watermark/ToS-gond.)* **Ajánlott:** egységesen önhosztolt, optimalizált GLB.
- [ ] **Render-minőség célplatform:** desktop-first látvány vs. mobil-first robusztusság; explicit minőség-fokozat rendszer. **Ajánlott:** auto-detect minőségszint + manuális low/medium/high kapcsoló.
- [ ] **Fény-architektúra:** dinamikus per-tárgy fény vs. baked lightmap. *(A 131→7 fény incidens miatt.)* **Ajánlott:** **baked lightmap + ambient/HDRI**, max 1-2 dinamikus fény.
- [ ] **Navigációs modell:** szabad first-person vs. teleport-pontok vs. vezetett kamera-túra vs. orbit. **Ajánlott:** first-person séta + teleport/fókusz-pontok a tárgyakhoz (mobilon a joystick frusztráló).
- [ ] **Ütközés:** kézi AABB (törékeny) vs. valódi collider. *(A `museum_2` bedrótozott fal-koordinátákat használ.)*
- [ ] **Hang-koncepció:** procedurális (fájlmentes) vs. valódi licencelt háttérzene + effektek vs. térbeli PositionalAudio vs. narráció. *(A `museum_2` 100% procedurális Web Audio — nincs audiofájl, ez jogi szempontból tiszta.)* **Ajánlott:** procedurális ambience + opcionális rövid, jogtiszta (CC0/saját) loop, némítás gombbal.
- [ ] **AudioContext resume biztosítva minden interakciónál?** *(Autoplay-policy: csak user gesture után indulhat.)*
- [ ] **Interaktivitás-szint** (lásd Gyors felmérés 8.) és **tartalom adat-vezéreltsége:** minden tartalom (2D + 3D) egységes forrásból? *(A `museum_2`-ben a festmények kódba égetettek, csak a GLB-k adat-vezéreltek.)* **Ajánlott:** egységes adat-vezérelt forrás típus-mezővel (3d/kép/tábla).
- [ ] **Kell-e WebXR (VR) vagy AR?** *(A `museum_2`-ben nincs valódi WebXR.)* **Ajánlott:** alapból nincs; csak explicit igényre (aránytalan teszt/eszköz-költség).
- [ ] **Loading UX nagy GLB-knél:** progress-bar, lazy-load, fallback ha a modell nem tölt. *(Most némán drótváz marad.)*
- [ ] **Látványstílus fixálva moodboarddal?** Stilizált/retró vs. tiszta PBR vs. fotorealisztikus. **Ajánlott:** stilizált vagy „tiszta PBR baked lightmappal"; fotorealizmust csak desktop-célon.
- [ ] **Oldal-metaadatok és megosztási előnézet (SEO/social):** `<title>`, `meta description`, favicon, Open Graph / Twitter Card kép — hogy link megosztásakor (Facebook, üzenet, kereső) szép előnézet jelenjen meg. *(A `museum_2`-ben nincs OG-tag és megosztási kép.)* **Ajánlott:** projektenként egyedi OG-kép (1200×630) + beszédes cím/leírás; megrendelő adja a logót.

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 5. ⚙️ Teljesítmény, eszköz- és böngészőtámogatás

- [ ] **Cél eszközosztályok és minimum hardver?** *(A `museum_2`-ben egy konkrét Mali-G615 miatt kellett a 131→7 fény-vágás.)* **Ajánlott:** „desktop + elmúlt 3 év közép-/felsőkategóriás mobil/tablet"; régi/gyenge eszköz best-effort.
- [ ] **Konkrét FPS-cél desktopon és mobilon — garancia vagy törekvés?** **Ajánlott:** desktop 60 / mobil 30 FPS cél a megnevezett referencia-eszközökön; máshol nincs garancia.
- [ ] **Tárgyszám + lazy-load/LOD igény** (lásd 3. szekció).
- [ ] **GLB-tömörítés + kliensoldali dekóder vállalva?** *(Lásd a kritikus loader-inkompatibilitást.)*
- [ ] **Böngészőmátrix definiálva** (támogatott vs. best-effort)? **Ajánlott:** garantált az utolsó 2 fő verzió Chrome/Edge/Firefox/Safari (desktop+mobil); Samsung Internet/WebView best-effort; >3 év kizárva.
- [ ] **WebGL-fallback gyenge eszközre / hiányzó WebGL-re?** *(A `museum_2`-ben fekete képernyő/crash a vége — az errors.log valós „domElement undefined" + 404 hibát rögzít.)* **Ajánlott:** min. barátságos magyar hibaüzenet; ideálisan egyszerű 2D galéria-fallback (egyben a11y-segítség).
- [ ] **Eszköz-detektálás megbízhatósága?** *(A `museum_2` UA-sniffingje az iPadOS 13+ iPadet desktopnak látja → kapja a teljes fény+árnyék terhelést.)* **Ajánlott:** touch + maxTouchPoints + GPU-renderer string + kézi minőség-kapcsoló; tablet alapból „közepes".
- [ ] **Betöltési idő (loading) budget, megadott hálózaton mérve?** **Ajánlott:** interaktív bejárás (váz + első szárny) < 5 mp átlagos 4G-n, többi lazy háttérben.
- [ ] **Külső függőségek: SRI + fallback + pinnelt verzió?** **Ajánlott:** min. pin + integrity + helyi fallback; ideálisan vendoring a repóba.
- [ ] **Mobil dinamikus fény abszolút plafon?** **Ajánlott:** MeshStandardMaterial mellett <8 fény mobilon; per-tárgy spotok mellőzve.
- [ ] **Helyszíni kioszk-mód kell-e?** *(Kiállítótermi érintőképernyő/totem: offline vagy gyenge net, automatikus visszaállás „attract" képernyőre inaktivitás után, kurzor elrejtése, fullscreen-lock, képernyő-alvás tiltása, esetleg több órás folyamatos futás memóriaszivárgás nélkül.)* **Ajánlott:** ha lesz fizikai kiállítás, külön kioszk-build offline asset-cache-sel (Service Worker) + auto-reset; ezt külön tételként árazd.
- [ ] **Mit garantálsz írásban és mit zársz ki (SLA-szerű elhatárolás)?** *(Védelem a végtelen mobil-bugriportok ellen.)*

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 6. 🖼️ Tartalom & kurátori munkafolyamat

- [ ] **Ki tölti fel és frissíti a tartalmat átadás után?** Megrendelő git+Excel / webes admin UI / te megbízásra. *(A `museum_2` git push + meta.xlsx workflow-t feltételez — nem-technikai megrendelőnek túl bonyolult.)* **Ajánlott:** nem-technikai megrendelőnél te frissítesz, vagy minimalista feltöltő UI.
- [ ] **Milyen metaadat-mezők kellenek az 5 alapon (Filename, Title, Author, License, SourceLink) túl?** *(Hiányzik: Description, Year, Category, Position, nyelv, poszter, audio-guide. A `museum_2`-ben minden tárgy „éve" fixen 'Sketchfab'.)* **Ajánlott:** + Description + Year + Category, és külön LicenseType + LicenseUrl.
- [ ] **Hány tárgy és fix-e a szám?** *(A `museum_2` pontosan 18 hardcode-olt helyre — `sfSpots` — épül; a 19. tárgynak nincs helye.)* **Ajánlott:** 20 felett a pozíciót tedd az adatmodellbe vagy auto-layoutba.
- [ ] **Egy- vagy többnyelvű, ki fordít?** **Ajánlott:** az adatmodellt eleve nyelvenkénti mezőkkel (Title_hu/Title_en, Desc_hu/Desc_en).
- [ ] **Ki írja a tárgyleírásokat és milyen hosszan?** *(A `museum_2`-ben fix sablonszöveg a kódban.)* **Ajánlott:** 1-3 mondat/tárgy a megrendelőtől, ~300 karakter limit (mobil felugró ablak).
- [ ] **Tartalom-átadási formátum és Filename↔fájlnév konvenció?** *(A leggyakoribb néma hiba: nem párosuló Filename → a tárgy szó nélkül kimarad — a `convert` `continue`-zik.)* **Ajánlott:** előre kitöltött Excel-sablon + azonos nevű GLB-k + validáló script, ami jelzi a párosítatlan sorokat.
- [ ] **Frissítési ciklus és önkiszolgálás vs. karbantartási szerződés?** **Ajánlott:** ritka frissítésnél karbantartási csomag; gyakorinál admin felület + betanítás.
- [ ] **Kellenek-e 2D tartalmak (poszter, festmény, információs tábla) is?** **Ajánlott:** egységes adat-vezérelt modellbe, ne két párhuzamos kódba (index.html vs. museum.html).
- [ ] **Olvasható feliratozás a térben (renderelt tábla) vagy elég a kattintós infó?** *(A `museum_2` táblája üres arany doboz; a licenc sehol nem látszik a 3D-ben — CC-BY-nél a látható kredit gyakran kötelező.)* **Ajánlott:** renderelt cím+szerző tábla (CanvasTexture) + licenc a kattintós ablakban.
- [ ] **CI-validáció a kurátornak:** jelez-e, ha hiányzik a Filename vagy a License „Unknown"?

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 7. ⚖️ Jog, licenc, kreditek, GDPR

- [ ] **Ki biztosítja a modelleket és ki szavatol a jogtisztaságukért?** *(KRITIKUS: a `museum_2`-ben mind License=„Unknown", Author=„Loricatus", a tényleges Sketchfab-szerző sehol → téves szerzőfeltüntetés, potenciális jogsértés.)* **Ajánlott:** megrendelő szavatol és mentesít (indemnifikáció); te nem építesz be „Unknown" licencet élesbe.
- [ ] **Megengedett licenctípusok, kereskedelmi/kiállítási felhasználás engedélyezett-e?** *(Sketchfab licencek: CC0/CC-BY/CC-BY-SA/CC-BY-NC/CC-BY-ND/Editorial/Standard — NC és Editorial gyakran tiltott nyilvános/kereskedelmi múzeumban.)* **Ajánlott:** CC0 + CC-BY engedélyezett; NC/ND/Editorial tiltott; License kötelező mező.
- [ ] **Letöltött GLB újra-hosztolás vs. élő iframe — és az attribúció megtartva?** *(A `museum_2` iframe-je `ui_watermark=0&ui_infos=0&ui_annotations=0` → elrejti a szerzőt és a vízjelet → sérti a Sketchfab ToS-t és a CC-attribúciót. A gltfpack-konverzió + Release = származékos mű terjesztése.)* **Ajánlott:** iframe-nél tartsd meg a vízjelet/attribúciót; letöltés csak ahol a licenc kifejezetten engedi.
- [ ] **Kreditálás módja és helye:** CREDITS oldal + in-app, valódi szerzővel. **Ajánlott:** mindkettő, valódi alkotó névvel.
- [ ] **Kell-e impresszum + adatkezelési/GDPR tájékoztató, ki készíti?** *(A `museum_2`-ben egyik sincs.)* **Ajánlott:** legyen; a szöveget a megrendelő/jogásza adja, te integrálod.
- [ ] **Lesz-e analytics/tracking?** *(Most nincs — ez jó.)* **Ajánlott:** alapból nincs; ha kell, cookie-mentes, IP-anonimizáló (Plausible/Matomo/GoatCounter) → nem kell cookie-banner.
- [ ] **Külső CDN-ek (Google Fonts, three.js) self-hostolva a GDPR-IP-továbbítás miatt?** *(Német Google Fonts ítéletek precedensek.)* **Ajánlott:** min. a Google Fonts + three.js/GLTFLoader self-hosted.
- [ ] **Forráskód-tulajdon átadáskor?** *(Nincs LICENSE fájl; idegen közreműködő — MayyDayy99 — PR-jei is bekerültek.)* **Ajánlott:** egyedi kódra kizárólagos felhasználási jog a megrendelőnek; újrahasznosítható komponensek nálad maradnak; third-party libek (three.js MIT) saját licencük szerint.
- [ ] **Portfólió-használat / kredit a láblécben / NDA?** **Ajánlott:** szerződésben rögzített portfólió-jog + diszkrét „fejlesztette" kredit.
- [ ] **Felhasználási jog bizonyítékainak archiválása (licenc-PDF, számla, engedély)?** *(A `museum_2`-ben csak SourceLink van — jogvitában nem elég.)* **Ajánlott:** minden modellhez archivált licenc/számla `/licenses` mappában vagy a megrendelőnél.

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 8. 📋 Projektkeret: hozzáférések, ár, határidő, átadás, karbantartás

- [ ] **Kié a GitHub fiók/szervezet, kell-e tulajdon-transzfer átadáskor?** *(A `museum_2`: org-repo, de fejlesztői magánemail mint commit-szerző → tulajdon keveredik.)* **Ajánlott:** eleve a megrendelő szervezetében dolgozz; leszállításkor a te hozzáférésed collaborator-szintűre csökken.
- [ ] **Domain stratégia + tulajdon** (lásd 2. szekció).
- [ ] **Hosting modell és átadhatóság** (lásd 1. szekció).
- [ ] **Nyers GLB-modellek tárolása és tulajdonjoga?** *(A CI törli a repóból → a Release az egyetlen másolat, nincs rá lokális git tag.)* **Ajánlott:** nyers GLB + meta.xlsx külön biztonságos helyen; az átadási csomag tartalmazza a teljes nyers készletet.
- [ ] **Árazási modell + fizetési ütemezés.** **Ajánlott:** fix díj + 30 napos jótállás + opcionális retainer; 40% indulás / 30% prototípus / 30% átadás.
- [ ] **Scope-kezelés:** mi az alapcsomag (tárgyszám, szárnyszám, mobil) és mi a felár? *(A „csak adj hozzá egy tárgyat" valójában mobil-GPU regressziót okozhat — órákba kerül.)* **Ajánlott:** rögzített alap (pl. 3 szárny, ~20 tárgy); efölött tárgyanként/szárnyanként felár.
- [ ] **Határidő + mérföldkövek + tartalom-leadási felelősség** (lásd Gyors felmérés 12.).
- [ ] **Átadási csomag tartalma:** forráskód + nyers modellek + kitöltött meta.xlsx sablon + írott kurátori/üzemeltetési útmutató + betanító hívás/videó. *(A `museum_2`-ben nincs README, és maradtak fejlesztői szennyeződések: `test_camera.js` lokális `file:///v:/2025/...` úttal, `upgrade.py` ad-hoc patch, `museum_backup.html`.)* **Ajánlott:** átadás előtt repo-takarítás.
- [ ] **Átvételi (acceptance) kritériumok írásban:** mi számít „kész"-nek? *(pl. a megnevezett eszköz-mátrixon végigtesztelve hibátlan, mind az X tárgy betöltődik, az FPS- és betöltési cél teljesül, a tartalom-pipeline-t a kurátor önállóan tudja használni.)* **Ajánlott:** az átvételi teszt-forgatókönyv + eszközlista a szerződés melléklete; az utolsó fizetési részlet ehhez kötött.
- [ ] **Ki teszteli és hagyja jóvá, milyen eszközökön?** *(Megelőzi a végtelen „nálam nem jó" kört.)* **Ajánlott:** közös átvételi teszt a megrendelő saját eszközein, rövid jegyzőkönyvvel.
- [ ] **Karbantartási vállalás (SLA):** meddig és mire terjed ki az ingyenes hibajavítás? **Ajánlott:** 30 nap jótállás a leszállításkori funkciók regresszióira; jövőbeli böngésző/CDN/three.js verzióváltás külön fizetős.
- [ ] **Backup-stratégia és verziózási folytonosság átadás után** (lásd 1. szekció).
- [ ] **Önhosztolt vendoring vs. CDN** (lásd 1./5. szekció).
- [ ] **Analytics/monitoring scope-ba és árba véve?** *(A `museum_2`-ben nincs éles hibakövetés.)*

`Megrendelői válaszok / megjegyzések: ____________________________________________`

---

## 📐 Technikai paraméterek & limitek

| Paraméter | Ajánlott érték / limit | Megjegyzés (forrás: `museum_2`) |
|---|---|---|
| **Modell formátum** | GLB (bináris glTF 2.0) | three.js GLTFLoader |
| **Geometria-kompresszió** | meshopt (`gltfpack -cc`) vagy Draco | **Kötelező** a megfelelő dekóder a kliensben (MeshoptDecoder / DRACOLoader) |
| **Textúra-kompresszió** | KTX2/Basis (`gltfpack -tc`) | **Kötelező** a KTX2Loader bedrótozása — különben néma betöltési hiba |
| **Fájlméret / modell** | max 3-5 MB tömörítve (cél: néhány száz KB) | tree.glb referencia: 162 KB optimalizálás után |
| **Összes asset (lazy nélkül)** | < 50 MB | efölött kötelező lazy load + CDN |
| **Poly-budget / modell** | < 50 000 háromszög | mobil GPU-érzékeny |
| **Textúra-felbontás** | max 2K desktop, 1K mobil (KTX2) | |
| **Dinamikus fény (mobil)** | < 8 fény MeshStandardMaterial mellett | 131 fény GPU shader-crash-t okozott (Mali-G615, ~256 vec4/~1024 float limit); javítás: 131→7 |
| **Árnyékvető fények** | erősen korlátozott | WebGL1 `MAX_TEXTURE_IMAGE_UNITS` gyakran 16; spot-árnyékok kikapcsolva |
| **pixelRatio cap** | mobil 1.5 / desktop 2.0 | fontos teljesítmény-szelep high-DPI eszközön |
| **Render-distance** | far plane ~120, fog ~30-80 egység | a látótávolság = teljesítmény-budget |
| **FPS-cél** | desktop 60 / mobil 30 | a megnevezett referencia-eszközökön |
| **Betöltési budget** | interaktív váz < 5 mp átlagos 4G-n | többi modell lazy háttérben |
| **GitHub Pages méret** | ~1 GB published site (soft) | nagy assetek Release-re/CDN-re szervezve |
| **GitHub Pages sávszél** | ~100 GB/hó (soft) | nagy 3D forgalomnál átléphető → throttle |
| **GitHub Pages build** | ~10 build/óra (ajánlott) | |
| **GitHub repo** | <1 GB ajánlott; fájl push-limit 100 MB (warning 50 MB) | ezért törli a CI a nyers GLB-ket |
| **GitHub Release asset** | max 2 GB/fájl, gyakorlatilag korlátlan db | de a böngésző-betöltéshez néhány MB az ajánlott; **abszolút URL kell** |
| **Apex domain (GitHub Pages)** | A: 185.199.108-111.153 + AAAA 2606:50c0:8000-8003::153 | vagy ALIAS/ANAME, ha a regisztrátor támogatja |
| **SSL** | Let's Encrypt automatikus | custom domainnél a tanúsítvány kiállása perc-óra (DNS-terjedés) |
| **DNS TTL** | 300 s migráció alatt | gyors visszavonhatóság |
| **three.js verzió** | friss, konkrét verzióra pinnelt, ESM | a `museum_2` r128 (2021, EOL, globál-script) |
| **Böngészőmátrix (garantált)** | utolsó 2 fő verzió: Chrome, Edge, Firefox, Safari (desktop+mobil) | Samsung Internet/WebView best-effort; >3 év kizárva |
| **Por-részecskék** | mobil 500 / desktop 1500 | per-frame render — akku/melegedés mobilon |
| **Hang** | procedurális (Web Audio) vagy CC0/saját loop | a `museum_2` 100% szintetizált → jogi szempontból tiszta |

---

## 🚩 Tipikus buktatók

1. **„Unknown" licenc → szerzői jogi jogsértés.** A `museum_2`-ben mind a 18 modell License=„Unknown", Author=„Loricatus" (a fejlesztő), miközben Sketchfab-eredetűek. Téves szerzőfeltüntetés + engedély nélküli (esetleg NC/Editorial) felhasználás publikus oldalon → DMCA-takedown vagy kártérítés. **Sose indulj „Unknown" licenccel; a megrendelő szavatoljon írásban.**

2. **Sketchfab iframe paraméterekkel elrejtett attribúció.** `ui_watermark=0&ui_infos=0&ui_annotations=0` → sérti a Sketchfab ToS-t és a CC-BY névfeltüntetést. **Tartsd meg a vízjelet/attribúciót.**

3. **Mobil GPU fény-limit.** Túl sok dinamikus fény (131) **némán** elhasalt shaderhez és láthatatlan geometriához vezet — nincs hibaüzenet, csak „üres" jelenet. **Baked lighting + <8 dinamikus fény mobilon.**

4. **Relatív modell-URL → néma 404.** A `releases/download/models/…` relatív út nem a Release valós domainje; csak azért működik, mert a tree.glb fizikailag be van commitolva. Domain/almappa-váltáskor minden modell 404-el. **Egyetlen, abszolút asset-bázis-URL.**

5. **Kompresszió/loader inkompatibilitás.** A CI `-cc -tc`-vel tömörít, de a loader nem kap dekódert → amint valódi tömörített fájl kerül a Release-re, **némán nem töltődik be.** **Kompresszió és dekóder mindig EGY döntés.**

6. **Néma adatvesztés a kurátori pipeline-ban.** Üres/nem párosuló Filename → a tárgy szó nélkül kimarad (`continue`). A `museum_2`-ben 18-ból 17 így hiányzik. **CI-validáció + visszajelzés a kurátornak.**

7. **Single point of failure a GitHub körül.** Kód + hosting + CI + assetek mind egy fiókban (LoricatusGroup). Fiók-felfüggesztés vagy a fejlesztővel való szakítás megöli az oldalt. A CI ráadásul törli a nyers GLB-ket → a Release az egyetlen másolat. **Megrendelő tulajdona + külön backup.**

8. **Fejlesztő-lock-in / tulajdon-keveredés.** Org-repo, de fejlesztői magánemailről jövő commitok. **Tiszta tulajdonjog az elején.**

9. **Külső CDN egyponti hiba.** three.js + GLTFLoader + Google Fonts, SRI és fallback nélkül → egy CDN-kiesés vagy hálózati szűrés megöli az appot. **Self-hosted vendoring vagy min. pin + SRI + fallback.**

10. **GDPR-kockázat.** Google Fonts + Sketchfab iframe a látogató IP-jét USA-ba küldi tájékoztatás nélkül (német precedensek). Nincs impresszum/adatkezelési tájékoztató. **Self-host + tájékoztató.**

11. **Minden push azonnal éles (nincs staging).** Egy hibás commit azonnal a látogató előtt. **PR/branch preview.**

12. **Scope-csúszás.** „Csak adj hozzá egy tárgyat" valójában mobil-GPU regressziót okozhat. **Rögzített alap-scope + felár.**

13. **Domain-lejárat.** Auto-renew nélkül az egész oldal egyik napról a másikra leáll; ha a fejlesztő nevén szól, túszul ejtett domain. **Megrendelő nevén, auto-renew, kettős értesítés.**

14. **„Félkész munkaasztal" átadáskor.** Lokális utak (`test_camera.js` → `file:///v:/2025/…`), ad-hoc `upgrade.py`, `museum_backup.html`, nincs README. **Repo-takarítás + dokumentáció + betanítás az átadási csomagban.**

15. **Tartalmi csúszás pénzügyi kockázata.** A kurátor késik a GLB+xlsx leadásával → ha a fizetés a végszámlához kötött, a te likviditásod szenved. **Előleg + mérföldkő-fizetés.**
