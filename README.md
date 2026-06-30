# Pixel Art Múzeum — 3D virtuális kiállítótér

Böngészőben futó, egyetlen `index.html`-be ágyazott 3D múzeum (three.js).
Négy szárnnyal, pixel-art festményekkel, szobrokkal és betölthető GLB-modellekkel.
Háromnyelvű felület: **magyar / angol / olasz** (a műtárgynevekkel együtt).

> Élő oldal: GitHub Pages (a `main` ágra pusholva automatikusan deployol).

---

## Felépítés

| Útvonal | Mi ez |
|---|---|
| `index.html` | A teljes alkalmazás — inline HTML + CSS + JS, nincs build-lépés. |
| `vendor/three/` | Self-hosted three.js (`three.min.js`, `GLTFLoader.js`) — nincs futásidejű CDN-függés. |
| `vendor/fonts/` | Self-hosted woff2 fontok (VT323, Press Start 2P). |
| `assets/exhibits.json` | A betöltendő GLB-modellek metaadatai (cím, szerző, licensz, év, modell-URL). |
| `assets/og-image.png` | Közösségi megosztás előnézeti kép. |
| `uploads/meta.xlsx` | A modellek forrás-táblázata (szerkeszthető Excel). |
| `tools/convert_xlsx_to_exhibits.mjs` | A `meta.xlsx`-ből generálja az `exhibits.json`-t és a `CREDITS.html`-t. |
| `releases/` | Helyi modell-másolat (a publikus deploybe **nem** kerül be — a site a GitHub Release abszolút URL-jéről tölt). |
| `felmeres_urlap/`, `FELMERESI_CHECKLIST.md` | Belső üzleti anyagok (ügyfél-felmérés). A publikus oldalra **nem** kerülnek ki. |

A `.github/workflows/deploy-pages.yml` a deploy előtt kiszedi a fenti belső/fejlesztői
fájlokat a CI-checkoutból (a repóban megmaradnak), és validálja, hogy az `index.html`
inline scriptje szintaktikailag helyes — törött JS nem megy ki élesbe.

---

## Helyi futtatás

Mivel az `index.html` `fetch`-csel tölti az `exhibits.json`-t és a modelleket,
egy egyszerű statikus szerver kell (a `file://` megnyitás CORS miatt nem elég):

```bash
# bármelyik megteszi
python3 -m http.server 8080
# vagy
npx serve .
```

Majd nyisd meg: <http://localhost:8080/>

A nyelvet a bal felső HU/EN/IT kapcsolóval lehet váltani (a választás localStorage-ba mentődik).

---

## Modell-pipeline (új kiállítási tárgyak felvétele)

1. Töltsd fel a `.glb` fájlt az `uploads/models/` mappába, és írd be a sorát a
   `uploads/meta.xlsx`-be (Filename, Title, Author, License, SourceLink, opcionálisan Year).
2. Pushold a `main` ágra. A `publish-models.yml` workflow ekkor:
   - `gltfpack`-kel optimalizálja a modelleket (KHR_mesh_quantization — meshopt/KTX2 tömörítés
     **nélkül**, mert a frontend GLTFLoader-e azt dekóder nélkül nem értené),
   - feltölti őket a `models` GitHub Release-re (mozgó tag) **és** egy SHA-taggelt
     immutable backup release-re,
   - lefuttatja a konvertert (`exhibits.json` + `CREDITS.html` frissítés),
   - visszacommitolja a generált fájlokat, és törli a nyers GLB-ket a repóból
     (a backup release megőrzi őket).
3. A `deploy-pages.yml` az `index.html` változására újradeployolja az oldalt.

### `MODEL_BASE_URL`

Az `exhibits.json` **abszolút** URL-eket tartalmaz, mert relatív út projekt-aloldalon
(`/museum_2/`) vagy egyedi domainen eltörne. Az alap-URL felülírható a konverter futtatásakor:

```bash
MODEL_BASE_URL="https://sajat-domain.pl/models/" node tools/convert_xlsx_to_exhibits.mjs
```

Alapértelmezés: `https://github.com/LoricatusGroup/museum_2/releases/download/models/`.

---

## Megjegyzés a hiányzó modellekről

A `meta.xlsx` több sort is tartalmazhat, amelyhez még **nincs feltöltött GLB**
(üres `Filename`). A konverter ezeket nem némán hagyja ki: figyelmeztetést ír ki, és
a futás végén összegzi, hány tárgy maradt ki. Ilyenkor csak a ténylegesen feltöltött
modellek kerülnek be az `exhibits.json`-ba — a hiányzók a `.glb` feltöltése után a fenti
pipeline újrafuttatásával jelennek meg.

---

## Tesztelés / validálás

Az inline script szintaxisa gyorsan ellenőrizhető (ugyanaz a kapu fut a deploy előtt):

```bash
node -e 'const h=require("fs").readFileSync("index.html","utf8");
const b=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,c)=>c.length-a.length)[0];
new Function(b); console.log("inline script OK");'
```
