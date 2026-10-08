import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';

const PORT = process.env.PORT || Number(process.argv[2]) || 3001;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const COLLECTIONS = new Set([
  'settings', 'plan', 'logs', 'shopManual', 'shopChecks', 'customRecipes',
  'foodNotes', 'recipeNotes', 'freezer', 'tests',
]);
const SPACE_RE = /^[a-z0-9-]{12,64}$/;

const store = await createStore();
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: store.kind });
});

app.post('/api/sync/:space', async (req, res) => {
  const { space } = req.params;
  if (!SPACE_RE.test(space)) return res.status(400).json({ error: 'Ugyldig delingskode' });

  const since = Number(req.body?.since) || 0;
  const raw = Array.isArray(req.body?.changes) ? req.body.changes : [];
  if (raw.length > 2000) return res.status(413).json({ error: 'For mange ændringer på én gang' });

  const changes = raw.filter((c) =>
    c && COLLECTIONS.has(c.col) && typeof c.id === 'string' && c.id.length <= 120 &&
    Number.isFinite(c.updatedAt));

  try {
    res.json(await store.sync(space, since, changes));
  } catch (err) {
    console.error('Sync-fejl:', err);
    res.status(500).json({ error: 'Serverfejl under synkronisering' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ukendt endpoint' }));

// Frontend (bygget med `npm run build`)
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, {
    setHeaders(res, file) {
      if (file.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Histamin-app kører på http://localhost:${PORT} (lager: ${store.kind})`);
});
