import { useState } from 'react';
import { get, put, remove, all, getSettings, newId } from '../lib/db.js';
import { today, addDays, range, fmt, cap, weekdayShort, fromKey, diffDays } from '../lib/dates.js';
import { getRecipe, recipeRating, thawText } from '../lib/recipes.js';
import { generatePlan } from '../lib/planner.js';
import { trialInfo } from '../lib/insights.js';
import { go } from '../lib/router.js';
import { PageHeader, Segmented, Sheet, Stepper, Dot, Empty, useToast } from '../components/ui.jsx';
import { useRecipeFilter, RecipeFilters, RecipeRow } from '../components/RecipePicker.jsx';
import Icon from '../components/Icon.jsx';

export default function Plan({ view }) {
  const setView = (v) => go(`/plan${v === 'plan' ? '' : `?v=${v}`}`);
  return (
    <div className="page">
      <PageHeader title="Madplan" sub="Aftensmad for hele forsøget" />
      <Segmented
        value={view}
        onChange={(v) => v && setView(v)}
        options={[
          { value: 'plan', label: '📅 Plan', toggle: false },
          { value: 'opskrifter', label: '📖 Opskrifter', toggle: false },
          { value: 'fryser', label: '❄️ Fryser', toggle: false },
        ]}
      />
      {view === 'plan' && <PlanView />}
      {view === 'opskrifter' && <RecipesView />}
      {view === 'fryser' && <FreezerView />}
    </div>
  );
}

function PlanView() {
  const s = getSettings();
  const info = trialInfo();
  const [extra, setExtra] = useState(0);
  const [edit, setEdit] = useState(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [toast, showToast] = useToast();
  const t = today();

  const dates = info.dates.length ? range(info.dates[0], info.dates.length + extra) : range(t, 14 + extra);
  const emptyCount = dates.filter((d) => d >= t && !get('plan', d)?.recipeId && !get('plan', d)?.text).length;

  const fill = (overwrite) => {
    const target = dates.filter((d) => d >= t);
    const n = generatePlan(target, { overwrite });
    showToast(n ? `${n} dage er planlagt` : 'Intet at udfylde');
    setConfirmNew(false);
  };

  return (
    <>
      <div className="row gap wrap">
        {emptyCount > 0 && (
          <button className="btn primary sm" onClick={() => fill(false)}>
            <Icon name="shuffle" size={16} /> Udfyld {emptyCount} tomme dage
          </button>
        )}
        <button className="btn ghost sm" onClick={() => setConfirmNew(true)}>
          <Icon name="shuffle" size={16} /> Ny plan fra i dag
        </button>
        <button className="btn ghost sm" onClick={() => go('/indkob')}>
          <Icon name="cart" size={16} /> Indkøbsliste
        </button>
      </div>

      <div className="plan-list">
        {dates.map((d) => {
          const e = get('plan', d);
          const r = getRecipe(e?.recipeId);
          const dayNo = info.dates.length ? diffDays(info.dates[0], d) + 1 : null;
          const isPast = d < t;
          const thaw = thawText(getRecipe(get('plan', addDays(d, 1))?.recipeId));
          const isWeekStart = fromKey(d).getDay() === 1;
          return (
            <div key={d}>
              {isWeekStart && d !== dates[0] && <div className="week-sep" />}
              <button className={`plan-day ${d === t ? 'today' : ''} ${isPast ? 'past' : ''}`} onClick={() => setEdit(d)}>
                <div className="plan-date">
                  <span className="plan-wd">{weekdayShort(d)}</span>
                  <b>{fromKey(d).getDate()}</b>
                  {dayNo && dayNo <= s.days && <span className="plan-no">dag {dayNo}</span>}
                </div>
                <div className="grow">
                  {r ? (
                    <>
                      <span className="plan-title"><Dot r={recipeRating(r)} /> {r.title}</span>
                      <span className="muted small">
                        {r.time} min · {e.servings || s.servings} pers.
                        {e.note ? ` · ${e.note}` : ''}
                      </span>
                    </>
                  ) : e?.text ? (
                    <span className="plan-title">{e.text}</span>
                  ) : (
                    <span className="muted">+ Vælg ret</span>
                  )}
                  {thaw && !isPast && <span className="thaw-note"><Icon name="snow" size={13} /> Tag {thaw} op til i morgen</span>}
                </div>
                {r && (
                  <span
                    className="icon-btn sm"
                    role="link"
                    onClick={(ev) => { ev.stopPropagation(); go(`/opskrift/${r.id}?dato=${d}`); }}
                    aria-label="Se opskrift"
                  >
                    <Icon name="book" size={18} />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <button className="btn ghost block" onClick={() => setExtra(extra + 7)}>Vis en uge mere</button>

      <PlanDaySheet date={edit} onClose={() => setEdit(null)} />

      <Sheet
        open={confirmNew}
        onClose={() => setConfirmNew(false)}
        title="Lav ny plan?"
        footer={
          <div className="row gap">
            <button className="btn ghost grow" onClick={() => setConfirmNew(false)}>Annullér</button>
            <button className="btn primary grow" onClick={() => fill(true)}>Lav ny plan</button>
          </div>
        }
      >
        <p>Alle dage fra i dag og frem bliver planlagt forfra. Tidligere dage røres ikke.</p>
        <p className="muted small">Retter I har givet 👎 kommer ikke med. Retter med 👍 kommer oftere.</p>
      </Sheet>
      {toast}
    </>
  );
}

export function PlanDaySheet({ date, onClose }) {
  const s = getSettings();
  const f = useRecipeFilter();
  const [custom, setCustom] = useState('');
  if (!date) return null;
  const e = get('plan', date) || {};
  const current = getRecipe(e.recipeId);

  const choose = (recipeId) => {
    put('plan', date, { ...e, recipeId, text: '' });
    onClose();
  };
  const setText = () => {
    if (!custom.trim()) return;
    put('plan', date, { ...e, recipeId: null, text: custom.trim() });
    setCustom('');
    onClose();
  };

  const freezer = all('freezer').filter((x) => (x.portions || 0) > 0);

  return (
    <Sheet open={!!date} onClose={onClose} title={cap(fmt(date))}>
      {(current || e.text) && (
        <div className="current-pick">
          <div className="grow">
            <span className="muted small">Planlagt</span>
            <b>{current ? current.title : e.text}</b>
          </div>
          <button className="icon-btn" onClick={() => { remove('plan', date); onClose(); }} aria-label="Fjern">
            <Icon name="trash" size={18} />
          </button>
        </div>
      )}
      {current && (
        <>
          <label className="field-label">Antal personer (fx dobbelt portion til frys/madpakke)</label>
          <Stepper value={e.servings || s.servings} onChange={(v) => put('plan', date, { ...e, servings: v })} min={1} max={12} unit="pers." />
          <label className="field-label" htmlFor="pnote">Note</label>
          <input id="pnote" className="input" value={e.note || ''} placeholder="Fx lav dobbelt – frys halvdelen" onChange={(ev) => put('plan', date, { ...e, note: ev.target.value })} />
        </>
      )}

      {freezer.length > 0 && (
        <>
          <h3 className="sub-title">Fra fryseren</h3>
          <div className="chips">
            {freezer.map((x) => (
              <button key={x.id} className="chip" onClick={() => { put('plan', date, { ...e, recipeId: null, text: `Fra fryseren: ${x.name}` }); onClose(); }}>
                ❄️ {x.name} ({x.portions})
              </button>
            ))}
          </div>
        </>
      )}

      <h3 className="sub-title">Vælg en ret</h3>
      <RecipeFilters f={f} />
      <div className="list">
        {f.list.map((r) => <RecipeRow key={r.id} r={r} onClick={() => choose(r.id)} right={r.id === e.recipeId ? <Icon name="check" /> : <span />} />)}
      </div>

      <h3 className="sub-title">Eller skriv selv</h3>
      <div className="row gap">
        <input className="input grow" value={custom} placeholder="Fx Rester, Middag hos mor" onChange={(ev) => setCustom(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && setText()} />
        <button className="btn" onClick={setText}>Gem</button>
      </div>
    </Sheet>
  );
}

function RecipesView() {
  const f = useRecipeFilter();
  return (
    <>
      <div className="row gap">
        <p className="muted small grow">{f.list.length} lavhistamin-retter. Farven viser den "værste" ingrediens.</p>
        <button className="btn primary sm" onClick={() => go('/opskrift-ny')}><Icon name="plus" size={16} /> Egen</button>
      </div>
      <RecipeFilters f={f} />
      <div className="list">
        {f.list.map((r) => <RecipeRow key={r.id} r={r} onClick={() => go(`/opskrift/${r.id}`)} />)}
      </div>
      {f.list.length === 0 && <Empty icon="🍳" title="Ingen opskrifter matcher" />}
    </>
  );
}

function FreezerView() {
  const items = all('freezer').sort((a, b) => (b.frozenAt || '').localeCompare(a.frozenAt || ''));
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(2);

  const add = () => {
    if (!name.trim()) return;
    put('freezer', newId(), { name: name.trim(), portions, frozenAt: today() });
    setName('');
    setPortions(2);
  };

  return (
    <>
      <div className="notice">
        <Icon name="snow" size={18} />
        <span>Frys rester samme dag, som de er lavet – så stopper histamin-dannelsen. Optø i køleskabet, og spis inden for et døgn.</span>
      </div>
      <div className="add-freezer">
        <input className="input" value={name} placeholder="Fx Kyllingesuppe" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <div className="row gap">
          <Stepper value={portions} onChange={setPortions} min={1} max={20} unit="port." />
          <button className="btn primary grow" onClick={add}><Icon name="plus" size={16} /> Læg i fryser</button>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty icon="❄️" title="Fryseren er tom">
          <p className="muted small">Retter, der kan fryses, er markeret med "kan fryses" i opskrifterne.</p>
        </Empty>
      ) : (
        <div className="list">
          {items.map((x) => (
            <div key={x.id} className={`list-row static ${x.portions ? '' : 'faded'}`}>
              <span className="grow">
                <b>{x.name}</b>
                <span className="muted small">Frosset {x.frozenAt ? fmt(x.frozenAt, { weekday: false }) : ''}</span>
              </span>
              <Stepper value={x.portions || 0} onChange={(v) => put('freezer', x.id, { ...x, portions: v })} min={0} max={50} />
              <button className="icon-btn sm" onClick={() => remove('freezer', x.id)} aria-label="Slet"><Icon name="trash" size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
