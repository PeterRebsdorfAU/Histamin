import { useState } from 'react';
import { get, put } from '../lib/db.js';
import { today, addDays, fmt, cap } from '../lib/dates.js';
import { headacheOf, trialInfo, dayComplete } from '../lib/insights.js';
import { getRecipe } from '../lib/recipes.js';
import { SYMPTOMS, HEADACHE_LABELS } from '../data/guide.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { go } from '../lib/router.js';
import { Card, HeadacheSlider, Stepper, Segmented, Scale, Toggle, Dot, headColor } from '../components/ui.jsx';
import HeadacheSheet from '../components/HeadacheSheet.jsx';
import FoodInput from '../components/FoodInput.jsx';
import Icon from '../components/Icon.jsx';

const SEV = [
  { value: 1, label: 'Let' },
  { value: 2, label: 'Moderat' },
  { value: 3, label: 'Kraftig' },
];

export default function LogDay({ date }) {
  const t = today();
  const info = trialInfo();
  const log = get('logs', date) || {};
  const set = (patch) => put('logs', date, { ...log, ...patch });
  const [hOpen, setHOpen] = useState(false);
  const [foodQ, setFoodQ] = useState('');

  const h = headacheOf(log);
  const dayNo = info.dates.indexOf(date) + 1;
  const plan = get('plan', date);
  const dinner = getRecipe(plan?.recipeId)?.title || plan?.text;
  const symptoms = log.symptoms || {};
  const offFoods = log.offPlanFoods || [];
  const meals = log.meals || {};

  const removeEpisode = (id) => {
    const episodes = (log.episodes || []).filter((e) => e.id !== id);
    set({ episodes });
  };

  return (
    <div className="page">
      <div className="day-nav">
        <button className="icon-btn" onClick={() => go(`/dagbog/${addDays(date, -1)}`)} aria-label="Forrige dag"><Icon name="left" /></button>
        <div className="center grow">
          <h1>{date === t ? 'I dag' : cap(fmt(date))}</h1>
          <p className="muted small">{dayNo > 0 ? `Dag ${dayNo} af ${info.total}` : date === t ? fmt(date) : 'Uden for forsøgsperioden'}</p>
        </div>
        <button className="icon-btn" disabled={date >= t} onClick={() => go(`/dagbog/${addDays(date, 1)}`)} aria-label="Næste dag"><Icon name="right" /></button>
      </div>

      {/* Hovedpine */}
      <Card title="Hovedpine" icon="🧠">
        <label className="field-label">
          Dagens værste hovedpine: <b style={{ color: headColor(h) }}>{h ?? '–'}</b> {h != null && `– ${HEADACHE_LABELS[h]}`}
        </label>
        <HeadacheSlider value={log.headache ?? h ?? 0} onChange={(v) => set({ headache: v })} />
        {!Number.isFinite(log.headache) && !(log.episodes || []).length && (
          <button className="btn ghost sm" onClick={() => set({ headache: 0 })}><Icon name="check" size={16} /> Ingen hovedpine i dag</button>
        )}

        {(log.episodes || []).length > 0 && (
          <ul className="episodes">
            {log.episodes.map((e) => (
              <li key={e.id}>
                <span className="ep-dot" style={{ background: headColor(e.intensity) }} />
                <span className="grow">kl. {e.time} · styrke {e.intensity}{e.note ? ` · ${e.note}` : ''}</span>
                <button className="icon-btn sm" onClick={() => removeEpisode(e.id)} aria-label="Slet episode"><Icon name="x" size={14} /></button>
              </li>
            ))}
          </ul>
        )}
        <button className="btn ghost sm" onClick={() => setHOpen(true)}><Icon name="plus" size={16} /> Tilføj episode med tidspunkt</button>

        <div className="field-row">
          <span>💊 Smertestillende (antal)</span>
          <Stepper value={log.meds ?? 0} onChange={(v) => set({ meds: v })} min={0} max={20} />
        </div>
        {(log.meds || 0) > 0 && (
          <input className="input" placeholder="Hvilken? Fx Panodil, Ipren" value={log.medsName || ''} onChange={(e) => set({ medsName: e.target.value })} />
        )}
      </Card>

      {/* Andre symptomer */}
      <Card title="Andre symptomer" icon="🩺">
        {SYMPTOMS.map((s) => (
          <div key={s.id} className="symptom-row">
            <span className="symptom-label">{s.icon} {s.label}</span>
            <Segmented size="sm" value={symptoms[s.id] || null} onChange={(v) => set({ symptoms: { ...symptoms, [s.id]: v || 0 } })} options={SEV} />
          </div>
        ))}
      </Card>

      {/* Mad */}
      <Card title="Mad" icon="🍽️">
        <label className="field-label">Holdt du dig til lavhistamin-kosten i dag?</label>
        <Segmented
          value={log.onPlan || null}
          onChange={(v) => set({ onPlan: v })}
          options={[{ value: 'ja', label: '✓ Ja' }, { value: 'delvist', label: 'Delvist' }, { value: 'nej', label: 'Nej' }]}
        />
        {(log.onPlan === 'delvist' || log.onPlan === 'nej') && (
          <div className="offplan">
            <label className="field-label">Hvad spiste/drak du, som ikke var på listen?</label>
            <div className="chips">
              {offFoods.map((fid) => (
                <button key={fid} className="chip on" onClick={() => set({ offPlanFoods: offFoods.filter((x) => x !== fid) })}>
                  <Dot r={FOOD_BY_ID[fid]?.r} /> {FOOD_BY_ID[fid]?.name} ✕
                </button>
              ))}
            </div>
            <FoodInput
              value={foodQ}
              onChange={setFoodQ}
              onPick={(f) => { if (!offFoods.includes(f.id)) set({ offPlanFoods: [...offFoods, f.id] }); setFoodQ(''); }}
              placeholder="Søg fødevare, fx rødvin, tomat…"
            />
            <textarea className="input" rows={2} placeholder="Beskriv evt. med egne ord (fx pizza til fødselsdag kl. 19)" value={log.offPlan || ''} onChange={(e) => set({ offPlan: e.target.value })} />
          </div>
        )}
        {dinner && <p className="muted small">Aftensmad ifølge planen: <b>{dinner}</b></p>}
        <details className="meals" open={!!(meals.morgen || meals.frokost || meals.snack)}>
          <summary>Notér måltider (valgfrit)</summary>
          {[['morgen', 'Morgenmad'], ['frokost', 'Frokost'], ['snack', 'Mellemmåltider'], ['aften', 'Aftensmad (hvis anden end planen)']].map(([k, label]) => (
            <div key={k}>
              <label className="field-label">{label}</label>
              <input className="input" value={meals[k] || ''} onChange={(e) => set({ meals: { ...meals, [k]: e.target.value } })} />
            </div>
          ))}
        </details>
      </Card>

      {/* Krop & hverdag */}
      <Card title="Søvn, stress & krop" icon="🛌">
        <div className="field-row">
          <span>😴 Søvn i nat</span>
          <Stepper value={log.sleepHours} onChange={(v) => set({ sleepHours: v })} min={0} max={14} step={0.5} start={7} unit="t" />
        </div>
        <label className="field-label">Søvnkvalitet</label>
        <Scale value={log.sleepQuality} onChange={(v) => set({ sleepQuality: v })} emojis={['😫', '😕', '😐', '🙂', '😴']} labels={['Meget dårlig', 'Dårlig', 'Ok', 'God', 'Meget god']} />
        <label className="field-label">Stressniveau</label>
        <Scale value={log.stress} onChange={(v) => set({ stress: v })} emojis={['😌', '🙂', '😐', '😟', '😣']} labels={['Ingen', 'Lidt', 'Noget', 'Meget', 'Ekstremt']} />
        <label className="field-label">Hvordan har du det generelt i dag?</label>
        <Scale value={log.wellbeing} onChange={(v) => set({ wellbeing: v })} emojis={['😞', '😕', '😐', '🙂', '😄']} labels={['Meget dårligt', 'Dårligt', 'Ok', 'Godt', 'Rigtig godt']} />

        <div className="field-row">
          <span>💧 Vand (glas à 2,5 dl)</span>
          <Stepper value={log.water ?? 0} onChange={(v) => set({ water: v })} min={0} max={20} />
        </div>
        <div className="field-row">
          <span>☕ Kaffe (kopper)</span>
          <Stepper value={log.coffee ?? 0} onChange={(v) => set({ coffee: v })} min={0} max={15} />
        </div>
        <Toggle checked={log.period} onChange={(v) => set({ period: v })} label="🩸 Menstruation i dag" />
      </Card>

      <Card title="Note" icon="📝">
        <textarea className="input" rows={3} placeholder="Alt andet, der kan have betydning – skærmtid, træning, vejr, stor fest…" value={log.note || ''} onChange={(e) => set({ note: e.target.value })} />
      </Card>

      <div className={`save-state ${dayComplete(log) ? 'ok' : ''}`}>
        {dayComplete(log) ? '✓ Dagen er udfyldt – godt gået!' : 'Gemmes automatisk. Udfyld hovedpine, mad og søvn for at fuldføre dagen.'}
      </div>
      {date === t && dayComplete(log) && <button className="btn primary block" onClick={() => go('/')}>Færdig</button>}

      <HeadacheSheet open={hOpen} onClose={() => setHOpen(false)} date={date} />
    </div>
  );
}
