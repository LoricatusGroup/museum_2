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

## 1. lépés — Ki férhet hozzá az adminhoz?

A hozzáférés **az adatbázisban** dől el, nem a felületen — a böngészőből érkező kérést
a Postgres bírálja el, így a szabályt nem lehet megkerülni a felület kicselezésével.

**A szabály:** admin az, akinek a címe **`@loricatus.hu`** végű, **vagy** rajta van a
kivétellistán — és a címét meg is erősítette.

| | Mit lát / mit tehet |
|---|---|
| Bejelentkezés nélkül (múzeumlátogató) | csak a publikált, kész tárgyak és narrációk |
| Bejelentkezve, de nem engedélyezett címmel | **ugyanannyit, mint egy látogató** — semmi adminhoz |
| Engedélyezett cím | minden: tárgyak, narráció, Drive-beállítások, feltöltés |

**Új kolléga felvétele:** Supabase → **Authentication → Users → Add user**,
`@loricatus.hu` címmel, „Auto Confirm User" bekapcsolva. Attól kezdve admin —
külön jogosultságot adni nem kell.

**Kivétel felvétele** (külsős, vagy más domainen lévő cím) — SQL Editorban:

```sql
insert into public.admin_allowlist (email, note)
values ('kulsos@pelda.hu', 'Miért kap hozzáférést');
```

Visszavonás: `delete from public.admin_allowlist where email = 'kulsos@pelda.hu';`
(A cím **kisbetűsen** kerüljön be.)

> A jelenlegi `pr.nemes@gmail.com` fiók a kivétellistán van, mert nem céges domainen
> van. Ha készül hozzá `@loricatus.hu` cím, ez a sor törölhető.

**Regisztráció kívülről nem lehetséges:** idegen címmel a fiók létre sem jön
(az adatbázis visszautasítja, a felület pedig „Database error saving new user"
üzenetet mutat). Ez a második védelmi vonal; az igazi kapu a fenti jogosultsági szabály.

> **Ez egy valós lyukat zárt be.** A korábbi beállítás szerint **bárki** regisztrálhatott
> bármilyen címmel, és a bejelentkezett felhasználók *kivétel nélkül* teljes admin jogot
> kaptak — tehát egy idegen törölhette volna az egész kiállítást. Méréssel ellenőrizve:
> idegen cím most 0 adminadatot lát és egyetlen írása sem megy át, a valódi admin pedig
> változatlanul mindent elér.

### Ha önkiszolgáló belépést szeretnél

Ez **még nincs kész**: a belépőoldalon ma csak e-mail + jelszó van, regisztráció nincs.
Két út van, mindkettő igényel egy kis beállítást:

- **Google-fiókkal** (ajánlott): a Google Cloud projektben OAuth Client ID, majd
  Supabase → Auth → Providers → Google. Nem megy levél, egy kattintás a belépés.
- **E-mail + jelszó**: ehhez saját levélküldő (SMTP) kell, mert a beépített Supabase
  küldő **óránként 2–3 levélnél elakad** (mérve: HTTP 429), és minden új kolléga
  megerősítő levelet igényelne.

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

1. Beilleszted a mappa linkjét, és **Hozzáadás**. **Több mappát is felvehetsz** (pl. külön
   a fotóknak és a 3D modelleknek) — a felvett mappák gombként jelennek meg, közöttük
   kattintással váltasz, az `×` pedig kiveszi a listából (a Drive-on nem történik semmi).
   A lista közös beállítás: a kollégáknak nem kell újra megadniuk.
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

### „Narráció” — hangos tárlatvezetés felirattal

A látogató a múzeumban a 🎧 gombbal nyitja meg a sávok listáját, és **kézzel választ**.
Ez szándékos: a felvétel **nem** vált magától attól, hol áll a térben. Az emelet és a szárny
csak **címke** a listában, hogy könnyebb legyen megtalálni a megfelelő sávot.

**Egy sáv felvétele:**

1. **Új sáv** → add meg a címet (ebből lesz az azonosító), az emeletet, és ha akarod, a szárnyat.
2. Válaszd ki a **hangfájlt** (MP3 ajánlott).
3. Illeszd be a **feliratot**. Ha időbélyeges (WebVTT), a szöveg a hanggal együtt fut a kép alján;
   ha csak sima szöveg, álló **átiratként** jelenik meg a lejátszó alatt.
4. Pipáld ki, hogy *megjelenjen a múzeumban*, és mentsd.

**Nyelvek.** Minden sávnak van HU / EN / IT pirulája. Zöld pipa = van hozzá hang, sárga = még
nincs publikálva, „+” = ez a nyelv még hiányzik (kattints rá a felvételhez). Ha egy nyelv
hiányzik, a látogató a magyar változatot kapja — a sáv nem tűnik el a listából.

> **Hangfájl nélkül a sáv nem jelenik meg** a múzeumban, akkor sem, ha publikáltra állítod.
> A lejátszóhoz hang kell; a felirat önmagában nem elég.

**A bevezető sáv.** Amelyik sávnál bepipálod, hogy *bevezető*, az kerül a lista élére, és a
látogató **egyszer** kap rá egy felajánlást belépéskor („Meghallgatom” / „Most nem”).
Magától semmi nem szólal meg.

**Ajánlott hangformátum**

| | Ajánlás |
|---|---|
| Formátum | **MP3** (minden böngésző lejátssza, iOS-en is) |
| Csatorna / bitráta | mono, 96–128 kbps — beszédhez bőven elég |
| Méret | kb. **1 MB percenként** (10 perces sáv kb. 10 MB) |
| Hossz | sávonként 2–4 perc; hosszú anyagot bontsatok több sávra |
| Egyéb elfogadott | M4A/AAC, OGG, WAV, FLAC — a WAV sokszorosa a méretnek, kerüljétek |

**Felirat (WebVTT) formátum**

```
WEBVTT

00:00:00.000 --> 00:00:04.500
Üdvözöljük a látogatóközpontban.

00:00:04.500 --> 00:00:09.000
A beruházás 2024 tavaszán indult.
```

A szerkesztő alatt látszik, hány feliratot ismert fel. Ha ott „egyetlen időbélyeg sem
értelmezhető” áll, elgépelés van az időpontokban (a helyes alak `óra:perc:mp.ezredmp`).
A látogató a **CC** gombbal ki-be kapcsolhatja a feliratot; a választását megjegyezzük.

## Korlátok

| | Határ |
|---|---|
| Drive-ról automatikus átmásolás | **100 MB** / fájl (efölött közvetlen feltöltés) |
| Közvetlen feltöltés | **500 MB** / fájl |
| Támogatott formátum | JPEG, PNG, WebP, GIF, AVIF · MP4, WebM, MOV · **GLB, glTF** · MP3, M4A, OGG, WAV, FLAC |

### 3D: az FBX és az OBJ automatikusan GLB lesz

A böngésző (three.js) csak **glTF/GLB**-t tud megjeleníteni, a tervezőktől viszont
jellemzően FBX vagy OBJ érkezik. Ezt nem kell kézzel megoldani:

- **Drive mappából:** az `.fbx` / `.obj` sor mellett ott a **„Konvertálás GLB-be”** gomb.
  A rendszer letölti a modellt *és a hozzá tartozó anyagleírót/textúrákat* (ugyanabból a
  mappából), a böngészőben átalakítja, feltölti a kész GLB-t, majd a nyers fájlokat törli.
- **Feltöltéskor:** húzd be az `.fbx`-et — vagy OBJ esetén az `.obj` + `.mtl` + textúrák
  fájlokat **egyszerre** —, és ugyanez történik. A kísérőfájlok nem lesznek külön
  kiállítási tárgyak.

A konvertálás **a te böngésződben** fut (nincs hozzá szerver, Blender vagy külön
szolgáltatás). A geometria és a textúrák egyetlen `.glb`-be kerülnek.

| | Határ |
|---|---|
| Konvertálandó modell | 100 MB |
| Modell + textúrái együtt | 180 MB, legfeljebb 16 fájl |

Nagy modellnél a konvertálás eltarthat egy percig — hagyd nyitva az oldalt.
Amit így sem tud fogadni (`.dae`, `.blend`, `.max`, `.stl`), azt a lista kiírja, indoklással.

> A külön textúra-JPG-ket (`*_occlusion.jpg`, `*_normal.jpg`, …) **ne** hozd be külön
> tárgyként — a GLB már tartalmazza őket. Az admin meg is jelöli ezeket „textúra?” címkével.

A videók a falon **némán, ciklusban** futnak, és csak akkor indulnak el, ha a látogató 22 egységnél
közelebb van — így egyszerre sosem dekódol sokat a gép. A hang a nagy nézetben kapcsol be
(kattints a videóra).

## Ha a Supabase nem elérhető

A múzeum nem áll meg: sorban próbálja a **Supabase → `assets/exhibits.json` → beépített demó**
forrásokat. Így egy kiesés csak a friss tartalmat érinti, a kiállítótér működik.
