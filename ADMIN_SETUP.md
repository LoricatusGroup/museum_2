# Admin felület — beüzemelés

A cég képeket, videókat és 3D modelleket tölthet fel, és azok megjelennek a 3D kiállítótérben.

- **Admin felület:** `admin.html` (a múzeummal együtt települ, pl. `…/museum_2/admin.html`)
- **Háttér:** Supabase projekt `museum-admin` (`kdvyewzykodtyqxgnnxa`, Frankfurt / eu-central-1)
- **Adatbázis:** `public.exhibits` tábla · **Tárhely:** `media` bucket · **Átmásolás:** `ingest-drive` Edge Function

---

## Miért nem elég a nyers Google Drive link?

A `drive.google.com/file/d/…/view` link **nem használható** futásidejű médiaforrásként:

1. Az a link egy HTML oldal, nem maga a fájl.
2. A „közvetlen" `uc?export=download` változaton **nincs CORS-fejléc** — a three.js `GLTFLoader`
   és a `VideoTexture` emiatt **némán** elhasal (ugyanaz a hibaosztály, amit a `publish-models.yml`
   is dokumentál a tömörítésnél).
3. Nagy fájlnál a Google vírusellenőrző HTML-t ad vissza a bináris helyett, és időnként
   megváltoztatja vagy blokkolja a hotlinkelést.

Ezért a Drive link **bemenet**, nem futásidejű forrás: a rendszer **egyszer** átmásolja a fájlt a
Supabase Storage-ba, és a múzeum onnan tölti — CORS-biztosan, CDN-ről, stabil URL-ről.

*(Mérés: a `googleapis.com/drive/v3/files/…?alt=media` végpont **küld** CORS-fejlécet, ezért
használható a szerveroldali átmásoláshoz — de kvótás és lassú, így nem jó minden látogatónak.)*

---

## 1. lépés — Admin felhasználó létrehozása

A Supabase irányítópulton: **Authentication → Users → Add user**
(e-mail + jelszó, „Auto Confirm User" bekapcsolva).

Majd **Authentication → Sign In / Providers → Email**: kapcsold **KI** az
„Allow new users to sign up" opciót, hogy kívülről senki ne tudjon regisztrálni.

> A tábla jogosultságai ellenőrizve: bejelentkezés nélkül **csak** a publikált, kész tárgyak
> olvashatók, írni pedig egyáltalán nem lehet.

## 2. lépés — Google hozzáférés a Drive-hoz

Válassz egyet. Mindkettőt a Supabase-ben kell megadni:
**Project Settings → Edge Functions → Secrets**.

### A) Service account — *ajánlott céges anyaghoz*
A fájlokat **nem** kell publikussá tenni.

1. Google Cloud Console → új projekt → **Drive API** engedélyezése.
2. **IAM & Admin → Service Accounts → Create** → **Keys → Add key → JSON**.
3. A Drive-mappát oszd meg a service account e-mail címével (`…@….iam.gserviceaccount.com`),
   „Olvasó" joggal. Ami a mappába kerül, az ettől kezdve behúzható.
4. Supabase secret neve: `GOOGLE_SERVICE_ACCOUNT_JSON`, értéke a **teljes JSON** tartalma.

### B) API kulcs — *gyorsabb, de gyengébb*
Csak a „bárki a linkkel" módon megosztott fájlokra működik.

1. Google Cloud Console → **APIs & Services → Credentials → Create → API key**.
2. Supabase secret neve: `GOOGLE_API_KEY`.

> Ha egyik sincs beállítva, a Drive-os betöltés érthető hibaüzenettel áll meg — a
> **közvetlen fájlfeltöltés** viszont Google nélkül is működik.

---

## 3. lépés — Kapcsolat ellenőrzése

Jelentkezz be az adminba, és nyomd meg a **„Kapcsolat ellenőrzése”** gombot a fejlécben.
Megmondja, elfogadta-e a Google a kulcsot, és **kiírja a service account e-mail címét** —
ezzel a címmel kell megosztani a Drive-mappát (Olvasó joggal).

Ha előtte beillesztesz egy Drive linket a bal oldali mezőbe, azt is leteszteli:
megnézi, tényleg olvasható-e az a konkrét fájl.

---

## Napi használat

Az admin két fülből áll.

### „Drive mappa” — a legegyszerűbb út

1. Egyszer beilleszted a mappa linkjét, és **Mentés**. Ez közös beállítás: a kollégáknak
   nem kell újra megadniuk.
2. A rendszer listázza a mappa tartalmát — az almappákba bele lehet kattintani.
   Amit már behoztál, azt **✓ „behozva”** jelöléssel, halványan mutatja, így nem lesz duplikátum.
3. Kipipálod, ami kell, és **Kijelöltek behozása**. A cím a fájlnévből jön, utólag szerkeszthető.

> **Fontos:** a mappa megosztása önmagában még nem teszi ki az anyagot a múzeumba —
> csak a *hozzáférést* adja meg. A behozás mindig tudatos lépés, hogy ne kerüljön ki
> véletlenül olyasmi, amit valaki csak odamásolt.

### „Kiállítás” — a kikerült anyag kezelése

- **Húzd be a fájlt** a szaggatott mezőbe (vagy kattints rá) — Google nélkül, közvetlenül.
- **+ Új tárgy**: egyetlen Drive fájl linkjéből.
- Kártyánként: **Szerkesztés** (cím, szerző, év, leírás, fordítások, szint),
  **Megjelenít / Elrejt**, **Törlés**.
- A kártyákat **húzással átrendezheted** — ez adja a falakon a sorrendet.
- Az állapot `várakozik → feldolgozás → kész`. Ha `kész` és „látható”, már benne van a
  múzeumban (frissítsd az oldalt).

**Mezők:** a *Szint* dönti el, melyik emeleten jelenik meg (földszint / 1. / 2.), a *Sorrend*
pedig a falhelyek kiosztásának sorrendjét. A feltöltött anyag **elsőbbséget élvez** a beépített
demó festményekkel szemben — sorban elfoglalja a falhelyeket az adott szinten.
Az angol/olasz fordítások nem kötelezők; ha üresen maradnak, a magyar szöveg jelenik meg.

## Korlátok

| | Határ |
|---|---|
| Drive-ról automatikus átmásolás | **100 MB** / fájl (efölött közvetlen feltöltés) |
| Közvetlen feltöltés | **500 MB** / fájl |
| Támogatott formátum | JPEG, PNG, WebP, GIF, AVIF · MP4, WebM, MOV · GLB, glTF |

A videók a falon **némán, ciklusban** futnak, és csak akkor indulnak el, ha a látogató 22 egységnél
közelebb van — így egyszerre sosem dekódol sokat a gép. A hang a nagy nézetben kapcsol be
(kattints a videóra).

## Ha a Supabase nem elérhető

A múzeum nem áll meg: sorban próbálja a **Supabase → `assets/exhibits.json` → beépített demó**
forrásokat. Így egy kiesés csak a friss tartalmat érinti, a kiállítótér működik.
