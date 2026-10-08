# 🌿 Lavhistamin – 14 dage

En mobilvenlig web-app (PWA) til et 14-dages lavhistamin-kostforsøg. Formålet er at finde ud af, om
histamin i kosten er årsag til hovedpine.

## Funktioner

| | |
|---|---|
| **I dag** | Status for forsøget (dag X af 14), "Må jeg spise …?"-søgning, hurtig registrering af hovedpine, aftens ret, påmindelse om optøning til i morgen, vandtæller og daglige vaner |
| **Fødevarer** | 260 fødevarer vurderet 0–3 (inspireret af SIGHI-listen), med forklaring (højt histamin, liberator, DAO-hæmmer, friskhed), alternativer og egne noter ("tåler / reagerer") |
| **Madplan** | 27 lavhistamin-aftensretter. Automatisk 14-dages plan med variation (fisk ca. 2 gange om ugen, hurtige retter på hverdage). Egne opskrifter med histamin-tjek af ingredienserne. Oversigt over fryseren |
| **Indkøb** | Indkøbsliste, der laver sig selv ud fra madplanen (3 dage, 4 dage, 1 uge …), sorteret efter butiksafdeling. Egne varer med advarsel, del listen |
| **Dagbog** | Hovedpine (0–10, episoder med tidspunkt), smertestillende, 8 andre symptomer, kost (på plan / afvigelser), søvn, stress, vand, kaffe, menstruation og noter |
| **Fremskridt** | Graf over hovedpine, sammenligning med før forsøget, første og anden halvdel, symptomoversigt og mønstre (søvn, stress, vand, cyklus, kostafvigelser) |
| **Rapport** | Udskriv eller gem som PDF til lægen |
| **Efter forsøget** | Guide til at genintroducere fødevarer, med testlog |
| **Viden** | Friskhed, rester, madlavning uden tomat/ost/soja, drikkevarer, andre hovedpine-triggere og hvornår man skal søge læge. Idéer til morgenmad, frokost og snacks |
| **Deling** | Madplan, indkøbsliste og dagbog synkroniseres mellem jeres telefoner via et delingslink |

Appen virker offline og kan installeres på hjemmeskærmen ("Føj til hjemmeskærm").

> ⚠️ Appen er et hjælpeværktøj til et kostforsøg og ikke medicinsk rådgivning. Vurderingerne af
> fødevarer er vejledende. Tal med lægen om vedvarende hovedpine.

## Arkitektur – og hvorfor der er en (lille) database

- **Lokal-først:** Alt gemmes i telefonens browser (localStorage). Appen virker uden net og åbner med
  det samme, også når Renders gratis server sover.
- **Valgfri synkronisering:** En lille Node/Express-server med én tabel i PostgreSQL gør, at I kan
  dele madplan, indkøbsliste og dagbog mellem to telefoner. Uden database kan I ikke se hinandens
  ændringer, og Renders gratis server har ingen fast disk.
- Ingen login: I deler en tilfældig delingskode (fx `dild-mango-k3j9x2a`). Koden er nøglen, så del
  den kun med hinanden.

```
React (Vite) PWA  ──localStorage──  telefon
        │  POST /api/sync/:kode  (kun ændringer, nyeste vinder)
Express (server/index.js)  ──  PostgreSQL (tabellen "records")
```

## Kør lokalt

Kræver Node 20+.

```bash
npm install
npm run dev
```

Åbn http://localhost:5173. Uden `DATABASE_URL` gemmer serveren delte data i `data/sync.json`.

Produktionsbuild lokalt:

```bash
npm run build
npm start
```

Åbn derefter http://localhost:3001.

Tjek af data (opskrifter peger på gyldige fødevarer):

```bash
npm run check
```

## Læg på GitHub

1. Opret et nyt, tomt repo på GitHub (fx `lavhistamin-app`). Tilføj ikke README eller .gitignore.
2. Kør i denne mappe:

```bash
git remote add origin https://github.com/<dit-brugernavn>/lavhistamin-app.git
git push -u origin main
```

## Udgiv på Render

### Mulighed A – én klik-løsning med Blueprint (anbefalet)

1. Gå til https://dashboard.render.com → **New** → **Blueprint**.
2. Vælg dit GitHub-repo. Render læser `render.yaml` og opretter:
   - web-servicen `lavhistamin` (gratis, Node)
   - databasen `lavhistamin-db` (gratis Postgres)
3. Klik **Apply**. Første build tager et par minutter.
4. Åbn URL'en (fx `https://lavhistamin.onrender.com`).

**Bemærk:**
- Renders gratis Postgres **udløber efter 30 dage**. Det passer til forsøget, og data ligger stadig
  på telefonerne. Tag en backup under *Indstillinger → Eksportér*, hvis I vil gemme dem.
- Man kan kun have én gratis Postgres pr. Render-konto. Har du allerede én, så brug mulighed B.

### Mulighed B – Neon som database (gratis, udløber ikke)

1. Opret et projekt på https://neon.tech, og kopiér connection string
   (`postgresql://…?sslmode=require`).
2. På Render: **New** → **Web Service** → vælg repoet.
   - Runtime: **Node**
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Instance type: **Free**
3. Under **Environment** tilføjes `DATABASE_URL` = din Neon connection string.
4. Klik **Deploy**.

Tabellen oprettes automatisk ved første start.

### Gratis-planens søvn

Renders gratis web-service går i dvale efter 15 minutter uden trafik og er op til ca. 1 minut om at
vågne. Appen åbner alligevel med det samme fra telefonens cache, og synkroniseringen sker i
baggrunden, når serveren er vågen.

## Kom i gang på telefonerne

1. Åbn appen på den første telefon, og gennemfør opsætningen (startdato, antal personer, hvordan
   hovedpinen har været indtil nu).
2. Gå til **☰ → Indstillinger & deling → Slå deling til → Del link**.
3. Åbn linket på den anden telefon. Den henter madplan og indstillinger automatisk.
4. Føj appen til hjemmeskærmen på begge telefoner.

## Projektstruktur

```
server/            Express-server + synkronisering (Postgres eller JSON-fil)
src/data/          Fødevarer, opskrifter, viden, tips
src/lib/           Lokal database, synk, madplan-generator, indkøb, statistik
src/pages/         Skærmene
src/components/    Genbrugelige UI-komponenter
public/            PWA-manifest, service worker, ikoner
scripts/           Udvikler-scripts (dev-server, ikoner, data-tjek)
```
