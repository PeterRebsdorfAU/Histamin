import { useState } from 'react';
import { FOOD_BY_ID, RATINGS } from '../data/foods.js';
import { PROTEINS } from '../data/recipes.js';
import { get, put, newId } from '../lib/db.js';
import { go } from '../lib/router.js';
import { PageHeader, Card, Dot, Stepper, Segmented } from '../components/ui.jsx';
import FoodInput from '../components/FoodInput.jsx';
import Icon from '../components/Icon.jsx';

const UNITS = ['g', 'stk', 'dl', 'ml', 'spsk', 'tsk', 'fed', 'bundt', 'kviste', 'cm', 'potte', 'knivspids'];

export default function RecipeEditor({ id }) {
  const existing = id ? get('customRecipes', id) : null;
  const [title, setTitle] = useState(existing?.title || '');
  const [desc, setDesc] = useState(existing?.desc || '');
  const [protein, setProtein] = useState(existing?.protein || 'kylling');
  const [time, setTime] = useState(existing?.time || 30);
  const [freezable, setFreezable] = useState(!!existing?.freezable);
  const [ings, setIngs] = useState(existing?.ingredients?.map((x) => ({ ...x, text: x.n || FOOD_BY_ID[x.f]?.name || '' })) || []);
  const [steps, setSteps] = useState((existing?.steps || []).join('\n'));
  const [newIng, setNewIng] = useState('');

  const addIng = (food) => {
    const text = food ? food.name : newIng.trim();
    if (!text) return;
    setIngs([...ings, { f: food?.id || null, text, q: '', u: food?.cat === 'gront' || food?.cat === 'frugt' ? 'stk' : 'g' }]);
    setNewIng('');
  };
  const updIng = (idx, patch) => setIngs(ings.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const save = () => {
    if (!title.trim()) return;
    const rid = id || `egen-${newId()}`;
    put('customRecipes', rid, {
      title: title.trim(),
      desc: desc.trim(),
      protein,
      time,
      servings: 2,
      freezable,
      ingredients: ings.map((x) => ({
        f: x.f || null,
        q: Number(String(x.q).replace(',', '.')) || 0,
        u: x.u,
        n: x.f && x.text === FOOD_BY_ID[x.f]?.name ? undefined : x.text,
        ...(x.opt ? { opt: true } : {}),
      })),
      steps: steps.split('\n').map((st) => st.trim()).filter(Boolean),
    });
    go(`/opskrift/${rid}`);
  };

  const bad = ings.filter((x) => x.f && FOOD_BY_ID[x.f]?.r >= 2);

  return (
    <div className="page">
      <PageHeader title={id ? 'Ret opskrift' : 'Ny opskrift'} backTo="/plan?v=opskrifter" />

      <Card>
        <label className="field-label" htmlFor="rt">Navn</label>
        <input id="rt" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fx Mormors kyllingeret" />
        <label className="field-label" htmlFor="rd">Kort beskrivelse</label>
        <input id="rd" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <label className="field-label">Protein</label>
        <div className="chips">
          {Object.entries(PROTEINS).map(([pid, p]) => (
            <button key={pid} className={`chip sm ${protein === pid ? 'on' : ''}`} onClick={() => setProtein(pid)}>{p.icon} {p.label}</button>
          ))}
        </div>
        <div className="grid2">
          <div>
            <label className="field-label">Tid</label>
            <Stepper value={time} onChange={setTime} min={5} max={240} step={5} unit="min" />
          </div>
          <div>
            <label className="field-label">Kan fryses?</label>
            <Segmented value={freezable} onChange={(v) => setFreezable(!!v)} options={[{ value: true, label: 'Ja', toggle: false }, { value: false, label: 'Nej', toggle: false }]} />
          </div>
        </div>
      </Card>

      <Card title="Ingredienser (til 2 personer)" icon="🧺">
        {bad.length > 0 && (
          <div className="notice warn">
            <Icon name="info" size={18} />
            <span>{bad.map((x) => FOOD_BY_ID[x.f].name).join(', ')} er vurderet "{RATINGS[2].label}" eller værre.</span>
          </div>
        )}
        {ings.map((x, idx) => (
          <div key={idx} className="ing-edit">
            <Dot r={x.f ? FOOD_BY_ID[x.f]?.r : null} />
            <input className="input qty" inputMode="decimal" value={x.q} placeholder="Antal" onChange={(e) => updIng(idx, { q: e.target.value })} />
            <select className="input unit" value={x.u} onChange={(e) => updIng(idx, { u: e.target.value })}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <input className="input grow" value={x.text} onChange={(e) => updIng(idx, { text: e.target.value })} />
            <button className="icon-btn sm" onClick={() => setIngs(ings.filter((_, i) => i !== idx))} aria-label="Fjern"><Icon name="x" size={16} /></button>
          </div>
        ))}
        <FoodInput value={newIng} onChange={setNewIng} onPick={addIng} onEnter={() => addIng(null)} placeholder="Tilføj ingrediens – fx kylling" />
        <p className="muted small">Vælg fra listen for at få histamin-tjek. Tryk Enter for fri tekst.</p>
      </Card>

      <Card title="Fremgangsmåde" icon="👩‍🍳">
        <textarea className="input" rows={7} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Ét trin pr. linje\nFx: Tænd ovnen på 200 grader'} />
      </Card>

      <button className="btn primary block" disabled={!title.trim()} onClick={save}>Gem opskrift</button>
    </div>
  );
}
