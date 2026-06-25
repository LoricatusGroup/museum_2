# 3D bemutatótér — felmérő kérdőív (építőipari cég)

Papíron, kézzel kitölthető ügyfél-felmérő kérdőív egy építőipari cég 3D virtuális
bemutatóterének megrendeléséhez. Az általános, bárki által megválaszolható
kérdésektől halad a végén a cég **rendszergazdájának** szóló technikai részig.
Minden választós kérdésnél X-elhető sablonválaszok, ahol kell „Nem tudom", és
szinte mindig egy „Egyéb" beírható sor.

## Fájlok

| Fájl | Mire való |
|---|---|
| `3d_bemutatoter_kerdoiv.pdf` | **A nyomtatandó, kész kérdőív** (A4). Ezt kell kinyomtatni és kitöltetni. |
| `3d_bemutatoter_kerdoiv.html` | A PDF forrása (a generátor állítja elő). |
| `questions.json` | A kérdőív tartalma adatként (100 kérdés, 5 szekció: A–E). **Ezt szerkeszd**, ha kérdést akarsz módosítani. |
| `questions_full156.json` | A teljes, 156 kérdéses „kérdésbank" (maxi verzió) — tartalék/forrás. |
| `gen_form.mjs` | HTML-generátor a `questions.json`-ból. |

## Szekciók

- **A.** Általános — a cégről és a célról *(bárki)*
- **B.** Tartalom — mit szeretnének bemutatni *(tartalom-/marketingfelelős)*
- **C.** Megjelenés, élmény, eszközök *(vezetés/marketing)*
- **D.** Üzemeltetés, domain, költség, tulajdon — ki mit csinál *(vezetés, IT-vel)*
- **E.** Részletes technikai kérdések *(a cég rendszergazdájának)*

## Újragenerálás (kérdés módosítása után)

```bash
# 1) Szerkeszd a questions.json-t (vagy cseréld le a teljes bankra)
# 2) HTML generálása:
node gen_form.mjs questions.json 3d_bemutatoter_kerdoiv.html
# 3) PDF készítése (headless Chromium; az elérési út a környezeté):
chromium --headless --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=3d_bemutatoter_kerdoiv.pdf 3d_bemutatoter_kerdoiv.html
```

A `questions.json` séma kérdésenként: `section` (A–E), `text`, `hint`,
`type` (`single` | `multi` | `text`), `options[]`, `hasOther`, `otherLabel`,
`hasDontKnow`, `textLines`.
