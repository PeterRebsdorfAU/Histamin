// Lager til synkronisering mellem enheder.
// - Med DATABASE_URL: PostgreSQL (Render Postgres eller Neon).
// - Uden: en lokal JSON-fil (kun til udvikling — Renders disk slettes ved genstart).
//
// Datamodel: én række pr. (space, col, id). "space" er den delte nøgle mellem
// jer to, "col" er samlingen (plan, logs, ...), og "seq" er en stigende tæller
// som klienten bruger til at hente "alt nyt siden sidst".

import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

export async function createStore() {
  if (process.env.DATABASE_URL) return createPgStore(process.env.DATABASE_URL);
  return createFileStore(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'sync.json'));
}

async function createPgStore(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 5 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      space      text    NOT NULL,
      col        text    NOT NULL,
      id         text    NOT NULL,
      data       jsonb,
      updated_at bigint  NOT NULL,
      deleted    boolean NOT NULL DEFAULT false,
      seq        bigserial,
      PRIMARY KEY (space, col, id)
    );
    CREATE INDEX IF NOT EXISTS records_space_seq ON records (space, seq);
  `);

  return {
    kind: 'postgres',
    async sync(space, since, changes) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const c of changes) {
          // Nyeste ændring vinder (last-write-wins pr. post).
          await client.query(
            `INSERT INTO records (space, col, id, data, updated_at, deleted)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (space, col, id) DO UPDATE
               SET data = EXCLUDED.data,
                   updated_at = EXCLUDED.updated_at,
                   deleted = EXCLUDED.deleted,
                   seq = nextval(pg_get_serial_sequence('records', 'seq'))
               WHERE records.updated_at < EXCLUDED.updated_at`,
            [space, c.col, c.id, c.deleted ? null : JSON.stringify(c.data), c.updatedAt, !!c.deleted],
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      const { rows } = await pool.query(
        `SELECT col, id, data, updated_at, deleted, seq FROM records
         WHERE space = $1 AND seq > $2 ORDER BY seq LIMIT 5000`,
        [space, since],
      );
      return {
        cursor: rows.length ? Number(rows[rows.length - 1].seq) : since,
        changes: rows.map((r) => ({
          col: r.col, id: r.id, data: r.data, updatedAt: Number(r.updated_at), deleted: r.deleted,
        })),
      };
    },
  };
}

async function createFileStore(file) {
  let db = { seq: 0, records: {} };
  try {
    db = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    /* ny fil */
  }
  let writing = Promise.resolve();
  const persist = () => {
    writing = writing.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(db));
    });
    return writing;
  };

  return {
    kind: 'file',
    async sync(space, since, changes) {
      for (const c of changes) {
        const key = `${space}|${c.col}|${c.id}`;
        const cur = db.records[key];
        if (cur && cur.updatedAt >= c.updatedAt) continue;
        db.records[key] = {
          space, col: c.col, id: c.id, data: c.deleted ? null : c.data,
          updatedAt: c.updatedAt, deleted: !!c.deleted, seq: ++db.seq,
        };
      }
      if (changes.length) await persist();
      const out = Object.values(db.records)
        .filter((r) => r.space === space && r.seq > since)
        .sort((a, b) => a.seq - b.seq);
      return {
        cursor: out.length ? out[out.length - 1].seq : since,
        changes: out.map(({ col, id, data, updatedAt, deleted }) => ({ col, id, data, updatedAt, deleted })),
      };
    },
  };
}
