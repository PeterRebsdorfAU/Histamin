import { useState } from 'react';
import { FOOD_BY_ID, RATINGS } from '../data/foods.js';
import { get, put, remove, all, newId } from '../lib/db.js';
import { today, addDays, range, fmt } from '../lib/dates.js';
import { buildShopping, groupBySection, fmtQty, shoppingText } from '../lib/shopping.js';
import { trialInfo } from '../lib/insights.js';
import { getRecipe } from '../lib/recipes.js';
import { go } from '../lib/router.js';
import { PageHeader, Check, Dot, Empty, useToast } from '../components/ui.jsx';
import FoodInput from '../components/FoodInput.jsx';
import Icon from '../components/Icon.jsx';

const RANGES = [
  { days: 3, label: '3 dage' },
  { days: 4, label: '4 dage' },
  { days: 7, label: '1 uge' },
];

export default function Shop() {
  const t = today();
  const info = trialInfo();
  const [from, setFrom] = useState(t);
  const [days, setDays] = useState(3);
  const [showStaples, setShowStaples] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newFood, setNewFood] = useState(null);
  const [toast, showToast] = useToast();

  const remaining = info.dates.length ? info.dates.filter((d) => d >= from).length : 14;
  const dates = range(from, days);
  const checkKey = (k) => `${from}|${k}`;
  const items = buildShopping(dates).map((it) => ({ ...it, checked: !!get('shopChecks', checkKey(it.key))?.checked }));
  const main = items.filter((i) => !i.staple);
  const staples = items.filter((i) => i.staple);
  const sections = groupBySection(main);
  const manual = all('shopManual').sort((a, b) => (a.checked === b.checked ? (a.createdAt || 0) - (b.createdAt || 0) : a.checked ? 1 : -1));
  const planned = dates.filter((d) => getRecipe(get('plan', d)?.recipeId)).length;
  const openCount = items.filter((i) => !i.checked && !i.staple).length + manual.filter((m) => !m.checked).length;

  const toggle = (it, v) => {
    if (v) put('shopChecks', checkKey(it.key), { checked: true });
    else remove('shopChecks', checkKey(it.key));
  };

  const addManual = (food) => {
    const name = food ? food.name : newItem.trim();
    if (!name) return;
    const f = food || newFood;
    put('shopManual', newId(), { name, foodId: f?.id || null, checked: false, createdAt: Date.now() });
    if (f && f.r >= 2) showToast(`⚠ ${f.name}: ${RATINGS[f.r].label}`);
    setNewItem('');
    setNewFood(null);
  };

  const share = async () => {
    const text = shoppingText(sections, manual);
    try {
      if (navigator.share) await navigator.share({ title: 'Indkøbsliste', text });
      else {
        await navigator.clipboard.writeText(text);
        showToast('Listen er kopieret');
      }
    } catch { /* annulleret */ }
  };

  const clearChecks = () => {
    items.forEach((it) => it.checked && remove('shopChecks', checkKey(it.key)));
    manual.filter((m) => m.checked).forEach((m) => remove('shopManual', m.id));
  };

  return (
    <div className="page">
      <PageHeader
        title="Indkøbsliste"
        sub={`${openCount} varer mangler`}
        right={<button className="icon-btn" onClick={share} aria-label="Del listen"><Icon name="share" /></button>}
      />

      <div className="range-picker">
        <div className="row gap">
          <button className="icon-btn" onClick={() => setFrom(addDays(from, -1))} aria-label="Dag før"><Icon name="left" size={18} /></button>
          <div className="grow center">
            <b>{from === t ? 'Fra i dag' : `Fra ${fmt(from)}`}</b>
            <span className="muted small">{fmt(dates[0], { weekday: false })} – {fmt(dates[dates.length - 1], { weekday: false })} · {planned} retter</span>
          </div>
          <button className="icon-btn" onClick={() => setFrom(addDays(from, 1))} aria-label="Dag efter"><Icon name="right" size={18} /></button>
        </div>
        <div className="chips center">
          {RANGES.map((r) => (
            <button key={r.days} className={`chip sm ${days === r.days ? 'on' : ''}`} onClick={() => setDays(r.days)}>{r.label}</button>
          ))}
          {info.dates.length > 0 && remaining > 7 && (
            <button className={`chip sm ${days === remaining ? 'on' : ''}`} onClick={() => setDays(remaining)}>Resten ({remaining})</button>
          )}
        </div>
      </div>

      {days > 4 && (
        <div className="notice">
          <Icon name="snow" size={18} />
          <span>Handler du ind til mange dage? Køb fisk på frost, og frys kødet, så snart du kommer hjem. Frugt, grønt og brød holder sig fint.</span>
        </div>
      )}

      {items.length === 0 && manual.length === 0 && (
        <Empty icon="🛒" title="Listen er tom">
          <p className="muted small">Der er ingen retter på madplanen i perioden.</p>
          <button className="btn primary sm" onClick={() => go('/plan')}>Gå til madplan</button>
        </Empty>
      )}

      {sections.map((s) => (
        <section key={s.id} className="shop-section">
          <h3 className="group-title">{s.label}</h3>
          {s.items.map((it) => (
            <Check key={it.key} checked={it.checked} onChange={(v) => toggle(it, v)}>
              <span className="shop-line">
                <span className="shop-name">
                  {it.name}
                  {it.variants.length > 0 && <span className="muted small"> ({it.variants.join(', ')})</span>}
                </span>
                <span className="shop-qty">{fmtQty(it.qty, it.unit)}</span>
              </span>
              <span className="shop-uses">{it.uses.join(' · ')}</span>
            </Check>
          ))}
        </section>
      ))}

      <section className="shop-section">
        <h3 className="group-title">Andet</h3>
        {manual.map((m) => {
          const f = FOOD_BY_ID[m.foodId];
          return (
            <div key={m.id} className="manual-row">
              <Check checked={m.checked} onChange={(v) => put('shopManual', m.id, { ...m, checked: v })}>
                <span className="shop-line">
                  <span className="shop-name">{m.name}</span>
                  {f && f.r >= 1 && <Dot r={f.r} />}
                </span>
              </Check>
              <button className="icon-btn sm" onClick={() => remove('shopManual', m.id)} aria-label="Slet"><Icon name="x" size={16} /></button>
            </div>
          );
        })}
        <div className="row gap">
          <div className="grow">
            <FoodInput
              value={newItem}
              onChange={(v) => { setNewItem(v); setNewFood(null); }}
              onPick={(f) => addManual(f)}
              onEnter={() => addManual(null)}
              placeholder="Tilføj vare…"
            />
          </div>
          <button className="btn" onClick={() => addManual(null)} aria-label="Tilføj"><Icon name="plus" size={18} /></button>
        </div>
      </section>

      {staples.length > 0 && (
        <section className="shop-section">
          <button className="group-title toggle-title" onClick={() => setShowStaples(!showStaples)}>
            Basisvarer – har I dem? ({staples.length}) <Icon name={showStaples ? 'minus' : 'plus'} size={16} />
          </button>
          {showStaples && staples.map((it) => (
            <Check key={it.key} checked={it.checked} onChange={(v) => toggle(it, v)}>
              <span className="shop-line">
                <span className="shop-name">{it.name}</span>
                <span className="shop-qty">{fmtQty(it.qty, it.unit)}</span>
              </span>
            </Check>
          ))}
        </section>
      )}

      {(items.some((i) => i.checked) || manual.some((m) => m.checked)) && (
        <button className="btn ghost block" onClick={clearChecks}>Ryd afkrydsede</button>
      )}

      <p className="muted small pad">
        Tip: Køb kød og fisk så tæt på madlavningsdagen som muligt – eller frys det straks. Listen kan deles med knappen
        øverst, og afkrydsninger ses på begge telefoner, hvis I har slået deling til.
      </p>
      {toast}
    </div>
  );
}
