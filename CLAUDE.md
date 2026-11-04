# museum_2 (Pixel Art Múzeum) – útmutató Claude-nak

Böngészős 3D múzeum egyetlen `index.html`-ben (three.js, build-lépés nélkül), plusz
`admin.html` (Supabase). A részletes felépítés a `README.md`-ben van.

A felhasználó magyarul ír, válaszolj magyarul.

## Fontos: a `main` = éles oldal

- Push a `main`-re élesít (`deploy-pages.yml`). Mindig ágon dolgozz és PR-t nyiss.
- `uploads/models/*.glb` vagy `uploads/meta.xlsx` változása a `main`-en a
  `publish-models.yml`-t is elindítja (GitHub Release + visszacommitolt `exhibits.json`).
- A deploy kiszedi a belső fájlokat (`felmeres_urlap/`, `tools/`, `supabase/`, ez a fájl
  stb.). Ha új belső fájlt adsz hozzá, vedd fel a „Prune non-public files” listára.

## Ellenőrzés

```bash
python3 -m http.server 8080          # majd http://localhost:8080
node tools/test_narration_museum.mjs   # headless böngészős teszt (puppeteer, előtte npm install)
```

A deploy validálja az `index.html` és az `admin.html` inline scriptjének szintaxisát;
ugyanezt érdemes helyben is lefuttatni a workflowból, mielőtt PR-t nyitsz. Változás
után Playwrighttal készíts képernyőképet.

## Tilos

- A `felmeres_urlap/` és `FELMERESI_CHECKLIST.md` (ügyfélanyag) kikerülése a publikus oldalra.
- Kulcsok commitolása; a Supabase anon kulcson kívül semmi titok nem lehet a kliensben.
