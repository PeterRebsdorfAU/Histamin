# 🌿 Lavhistamin – 14 dage

En mobilvenlig web-app (PWA) til et 14-dages lavhistamin-kostforsøg. Formålet er at finde ud af, om
histamin i kosten er årsag til hovedpine.

## Funktioner

| | |
|---|---|
| **I dag** | Status for forsøget (dag X af 14), "Må jeg spise …?"-søgning, hovedpine med ét tryk, de seneste 7 dage (tryk for at rette), dagens histamin-niveau og aftenens ret |
| **Mad-tjek (AI)** | Skriv med egne ord, hvad du har spist. Google Gemini vurderer hver fødevare op mod appens fødevareliste og udfylder selv dagens histamin-niveau og problematiske fødevarer. Uden AI-nøgle laver appen et simpelt opslag i stedet |
| **Fødevarer** | 260 fødevarer vurderet 0–3 (inspireret af SIGHI-listen), med forklaring, alternativer og egne noter ("tåler / reagerer") |
| **Madplan** | 27 lavhistamin-aftensretter, automatisk 14-dages plan, egne opskrifter med histamin-tjek og en oversigt over fryseren |
| **Fremskridt** | Graf over hovedpine, sammenligning med før forsøget, første og anden halvdel, og om hovedpine følger dage med meget histamin |
| **Rapport** | Udskriv eller gem som PDF til lægen |
| **Efter forsøget** | Guide til at genintroducere fødevarer, med testlog |
| **Viden** | Friskhed, rester, madlavning uden tomat/ost/soja, drikkevarer, andre hovedpine-triggere og hvornår man skal søge læge |
| **Deling** | Madplan, hovedpine og mad-tjek synkroniseres mellem jeres telefoner via et delingslink |

Appen virker offline og kan installeres på hjemmeskærmen ("Føj til hjemmeskærm").

> ⚠️ Appen er et hjælpeværktøj til et kostforsøg og ikke medicinsk rådgivning. Vurderingerne af
> fødevarer er vejledende. Tal med lægen om vedvarende hovedpine.

## Arkitektur – og hvorfor der er en (lille) database

- **Lokal-først:** Alt gemmes i telefonens browser (localStorage). Appen virker uden net og åbner med
  det samme, også når Renders gratis server sover.
- **Valgfri synkronisering:** En lille Node/Express-server med én tabel i PostgreSQL gør, at I kan
  dele madplan, hovedpine og mad-tjek mellem to telefoner. Uden database kan I ikke se hinandens
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

### AI mad-tjek (Google Gemini)

Samme opsætning som i IndkøbsApp. Nøglen ligger kun på serveren og sendes aldrig til telefonen.

1. Brug den samme Gemini-nøgle som i IndkøbsApp, eller opret en ny på https://aistudio.google.com/apikey.
2. På Render: åbn servicen **lavhistamin** → **Environment** → tilføj `GEMINI_API_KEY` = nøglen.
   Valgfrit: `GEMINI_MODEL` (standard `gemini-flash-latest`).
3. Gem. Render genstarter servicen, og under *Indstillinger → AI mad-tjek* står der nu "Slået til".

Uden nøgle virker appen stadig, men Mad-tjek laver kun et simpelt opslag i fødevarelisten. Serveren
tillader højst 40 AI-tjek i timen pr. IP-adresse for at beskytte kvoten.

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
server/            Express-server, synkronisering (Postgres eller JSON-fil) og AI (Gemini)
src/data/          Fødevarer, opskrifter, viden, tips
src/lib/           Lokal database, synk, madplan-generator, mad-tjek, statistik
src/pages/         Skærmene
src/components/    Genbrugelige UI-komponenter
public/            PWA-manifest, service worker, ikoner
scripts/           Udvikler-scripts (dev-server, ikoner, data-tjek)
```
