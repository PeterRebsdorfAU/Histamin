import { useMemo, useState } from 'react';
import { FOODS, CATEGORIES, RATINGS, searchFoods } from '../data/foods.js';
import { get } from '../lib/db.js';
import { go } from '../lib/router.js';
import { Rating, PageHeader } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const STATUS_BADGE = { ok: '✓ Tåler', reaction: '⚠ Reagerer', unsure: '? Usikker' };

export default function Foods({ initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState(null);
  const [rf, setRf] = useState('all');

  const list = useMemo(() => {
    let l = FOODS;
    if (cat) l = l.filter((f) => f.cat === cat);
    if (rf === 'ok') l = l.filter((f) => f.r === 0);
    if (rf === 'some') l = l.filter((f) => f.r === 1);
    if (rf === 'avoid') l = l.filter((f) => f.r >= 2);
    if (rf === 'mine') l = l.filter((f) => get('foodNotes', f.id)?.status);
    return searchFoods(q, l);
  }, [q, cat, rf]);

  const grouped = useMemo(() => {
    if (q.trim()) return [{ id: 'res', label: `${list.length} resultater`, items: list }];
    return CATEGORIES.map((c) => ({ ...c, items: list.filter((f) => f.cat === c.id) })).filter((g) => g.items.length);
  }, [list, q]);

  return (
    <div className="page">
      <PageHeader title="Fødevarer" sub="Hvad tåles – og hvad skal undgås under forsøget?" />

      <div className="search-big sticky">
        <Icon name="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søg, fx tomat, ost, laks…" aria-label="Søg" autoFocus={!!initialQuery} />
        {q && <button className="icon-btn sm" onClick={() => setQ('')} aria-label="Ryd"><Icon name="x" size={18} /></button>}
      </div>

      <div className="chips scroll">
        {[
          ['all', 'Alle'], ['ok', '🟢 Tåles godt'], ['some', '🟡 Små mængder'], ['avoid', '🔴 Undgå'], ['mine', '⭐ Egne noter'],
        ].map(([id, label]) => (
          <button key={id} className={`chip ${rf === id ? 'on' : ''}`} onClick={() => setRf(id)}>{label}</button>
        ))}
      </div>
      <div className="chips scroll">
        <button className={`chip sm ${!cat ? 'on' : ''}`} onClick={() => setCat(null)}>Alle kategorier</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip sm ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(cat === c.id ? null : c.id)}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <details className="legend">
        <summary>Hvad betyder farverne?</summary>
        {RATINGS.map((r) => (
          <div key={r.r} className="legend-row"><Rating r={r.r} size="sm" /><span className="small">{r.desc}</span></div>
        ))}
      </details>

      {grouped.length === 0 && (
        <p className="muted pad">
          Ingen fødevarer fundet. Kender du ikke en fødevare, så gælder tommelfingerreglen: frisk og uforarbejdet er godt –
          modnet, fermenteret, røget, syltet eller længe opbevaret er skidt.
        </p>
      )}

      {grouped.map((g) => (
        <section key={g.id} className="food-group">
          <h3 className="group-title">{g.icon} {g.label}</h3>
          <div className="list">
            {g.items.map((f) => {
              const note = get('foodNotes', f.id);
              return (
                <button key={f.id} className="list-row" onClick={() => go(`/mad/${f.id}`)}>
                  <span className="grow">
                    {f.name}
                    {note?.status && <span className={`mini-badge st-${note.status}`}>{STATUS_BADGE[note.status]}</span>}
                  </span>
                  <Rating r={f.r} size="sm" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <p className="muted small pad">
        Vurderingerne er vejledende og bygger på offentligt tilgængelige lavhistamin-lister (bl.a. SIGHI). Tolerance er
        individuel – brug "Din erfaring" på hver fødevare til at notere, hvad der virker for dig.
      </p>
    </div>
  );
}
