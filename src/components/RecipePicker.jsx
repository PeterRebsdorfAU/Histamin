import { useMemo, useState } from 'react';
import { allRecipes, recipeRating, recipeOpinion } from '../lib/recipes.js';
import { PROTEINS } from '../data/recipes.js';
import { Dot } from './ui.jsx';
import Icon from './Icon.jsx';

export function useRecipeFilter() {
  const [q, setQ] = useState('');
  const [protein, setProtein] = useState(null);
  const [onlyQuick, setOnlyQuick] = useState(false);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return allRecipes().filter((r) =>
      (!protein || r.protein === protein) &&
      (!onlyQuick || (r.time || 99) <= 30) &&
      (!n || r.title.toLowerCase().includes(n) || (r.desc || '').toLowerCase().includes(n)));
  }, [q, protein, onlyQuick]);
  return { q, setQ, protein, setProtein, onlyQuick, setOnlyQuick, list };
}

export function RecipeFilters({ f }) {
  return (
    <>
      <div className="search-big">
        <Icon name="search" />
        <input value={f.q} onChange={(e) => f.setQ(e.target.value)} placeholder="Søg opskrift…" aria-label="Søg opskrift" />
      </div>
      <div className="chips scroll">
        <button className={`chip sm ${f.onlyQuick ? 'on' : ''}`} onClick={() => f.setOnlyQuick(!f.onlyQuick)}>⚡ Max 30 min</button>
        {Object.entries(PROTEINS).map(([id, p]) => (
          <button key={id} className={`chip sm ${f.protein === id ? 'on' : ''}`} onClick={() => f.setProtein(f.protein === id ? null : id)}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>
    </>
  );
}

export function RecipeRow({ r, onClick, right }) {
  const op = recipeOpinion(r.id);
  return (
    <button className="list-row recipe-row" onClick={onClick}>
      <Dot r={recipeRating(r)} />
      <span className="grow">
        <span className="recipe-title">{r.title}</span>
        <span className="muted small">
          {PROTEINS[r.protein]?.icon} {r.time ? `${r.time} min` : ''}
          {r.freezable ? ' · kan fryses' : ''}
          {r.thaw ? ' · ❄ optø dagen før' : ''}
          {r.custom ? ' · egen' : ''}
          {op?.vote === 'up' ? ' · 👍' : op?.vote === 'down' ? ' · 👎' : ''}
        </span>
      </span>
      {right ?? <Icon name="right" size={18} />}
    </button>
  );
}
