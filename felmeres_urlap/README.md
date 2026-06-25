# 3D bemutatótér — felmérő kérdőív (építőipari cég)

Papíron, kézzel kitölthető ügyfél-felmérő kérdőív egy építőipari cég 3D virtuális
bemutatóterének megrendeléséhez. Az általános, bárki által megválaszolható
kérdésektől halad a végén a cég **rendszergazdájának** szóló technikai részig.
Minden választós kérdésnél X-elhető sablonválaszok, ahol kell „Nem tudom", és
szinte mindig egy „Egyéb" beírható sor.

## Fájlok

Két változat készült:

- **Teljes** kérdőív (100 kérdés, A–E szekciók) — alapos felmérésre.
- **Gyors** kérdőív (20 kérdés) — az első egyeztetéshez, a legfontosabb döntésekkel.

| Fájl | Mire való |
|---|---|
| `3d_bemutatoter_kerdoiv.pdf` | **A teljes, nyomtatandó kérdőív** (A4, 100 kérdés). |
| `3d_bemutatoter_kerdoiv_rovid.pdf` | **A gyors, nyomtatandó kérdőív** (A4, 20 kérdés). |
| `3d_bemutatoter_kerdoiv*.html` | A PDF-ek forrása (a generátor állítja elő). |
| `questions.json` | A teljes kérdőív tartalma adatként (100 kérdés). **Ezt szerkeszd** a teljeshez. |
| `questions_quick.json` | A gyors kérdőív tartalma (20 kérdés) + saját cím/útmutató (`meta`). |
| `questions_full156.json` | A teljes, 156 kérdéses „kérdésbank" (maxi verzió) — tartalék/forrás. |
| `gen_form.mjs` | HTML-generátor a `questions*.json`-ból. |

## Szekciók

- **A.** Általános — a cégről és a célról *(bárki)*
- **B.** Tartalom — mit szeretnének bemutatni *(tartalom-/marketingfelelős)*
- **C.** Megjelenés, élmény, eszközök *(vezetés/marketing)*
- **D.** Üzemeltetés, domain, költség, tulajdon — ki mit csinál *(vezetés, IT-vel)*
- **E.** Részletes technikai kérdések *(a cég rendszergazdájának)*

## Újragenerálás (kérdés módosítása után)

```bash
# 1) Szerkeszd a questions.json-t (teljes) vagy a questions_quick.json-t (gyors)
# 2) HTML generálása:
node gen_form.mjs questions.json       3d_bemutatoter_kerdoiv.html
node gen_form.mjs questions_quick.json 3d_bemutatoter_kerdoiv_rovid.html
# 3) PDF készítése (headless Chromium; az elérési út a környezeté):
chromium --headless --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=3d_bemutatoter_kerdoiv.pdf 3d_bemutatoter_kerdoiv.html
```

A JSON séma kérdésenként: `section` (a szekció kulcsa VAGY címe), `text`, `hint`,
`type` (`single` | `multi` | `text`), `options[]`, `hasOther`, `otherLabel`,
`hasDontKnow`, `textLines`. A `sections[]` elemei: `key` (lehet üres), `title`,
`who`, opcionálisan `pageBreak: true` (új oldalon kezdődjön). A dokumentum
opcionális `meta` mezője felülírja a címet/alcímet/útmutatót (`title`,
`subtitle`, `howto`).
