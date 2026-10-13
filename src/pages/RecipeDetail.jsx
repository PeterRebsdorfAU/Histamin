import { useState } from 'react';
import { FOOD_BY_ID } from '../data/foods.js';
import { PROTEINS } from '../data/recipes.js';
import { get, put, remove, getSettings } from '../lib/db.js';
import { getRecipe, recipeRating, recipeWarnings, recipeOpinion, foodStatus } from '../lib/recipes.js';
import { fmtQty } from '../lib/format.js';
import { today, addDays, fmt, cap, range } from '../lib/dates.js';
import { trialInfo } from '../lib/insights.js';
import { go, back } from '../lib/router.js';
import { PageHeader, Card, Dot, Rating, Stepper, Sheet, Empty, useToast } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function RecipeDetail({ id, planDate }) {
  const r = getRecipe(id);
  const s = getSettings();
  const planEntry = planDate ? get('plan', planDate) : null;
  const [servings, setServings] = useState(planEntry?.servings || s.servings || 2);
  const [done, setDone] = useState({});
  const [pickDate, setPickDate] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [toast, showToast] = useToast();

  if (!r) return <Empty title="Opskriften findes ikke" />;
  const scale = servings / (r.servings || 2);
  const op = recipeOpinion(id) || {};
  const warnings = recipeWarnings(r);
  const rating = recipeRating(r);
  const vote = (v) => put('recipeNotes', id, { ...op, vote: op.vote === v ? null : v });

  const info = trialInfo();
  const dates = (info.dates.length ? info.dates : range(today(), 14)).filter((d) => d >= today());

  return (
    <div className="page">
      <PageHeader
        title={r.title}
        sub={`${PROTEINS[r.protein]?.icon || ''} ${PROTEINS[r.protein]?.label || ''} · ${r.time} min`}
        backTo="/plan?v=opskrifter"
      />
      {r.desc && <p className="lead">{r.desc}</p>}

      <div className="tag-row">
        <span className={`tag tag-r${rating}`}><Dot r={rating} /> {['Lavhistamin', 'Indeholder lidt "gult"', 'Indeholder "undgå"', 'Indeholder "undgå helt"'][rating]}</span>
        {r.freezable && <span className="tag">❄️ Kan fryses</span>}
        {r.thaw && <span className="tag">🧊 Optø {r.thaw} dagen før</span>}
        {r.custom && <span className="tag">✏️ Egen opskrift</span>}
      </div>

      {warnings.length > 0 && (
        <div className="notice warn">
          <Icon name="info" size={18} />
          <span>
            Bemærk: {warnings.map((w) => `${w.food.name}${w.reaction ? ' (du har noteret en reaktion)' : ''}`).join(', ')}.
            Overvej at udelade eller erstatte.
          </span>
        </div>
      )}

      <Card
        title="Ingredienser"
        icon="🧺"
        action={<Stepper value={servings} onChange={setServings} min={1} max={12} unit="pers." />}
      >
        <ul className="ing-list">
          {(r.ingredients || []).map((ing, idx) => {
            const food = FOOD_BY_ID[ing.f];
            const st = ing.f ? foodStatus(ing.f) : null;
            return (
              <li key={idx} className={ing.opt ? 'opt' : ''}>
                <span className="ing-qty">{ing.q ? fmtQty(ing.q * scale, ing.u) : ing.u}</span>
                <span className="grow">
                  {food ? (
                    <button className="link-btn plain" onClick={() => go(`/mad/${food.id}`)}>{ing.n || food.name.toLowerCase()}</button>
                  ) : (
                    ing.n
                  )}
                  {ing.opt && <span className="muted small"> (valgfri)</span>}
                  {st === 'reaction' && <span className="mini-badge st-reaction">⚠ Reagerer</span>}
                </span>
                {food ? <Dot r={food.r} /> : <Dot r={null} />}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Fremgangsmåde" icon="👩‍🍳">
        <ol className="steps">
          {(r.steps || []).map((st, idx) => (
            <li key={idx} className={done[idx] ? 'done' : ''} onClick={() => setDone({ ...done, [idx]: !done[idx] })}>
              <span className="step-no">{done[idx] ? '✓' : idx + 1}</span>
              <span>{st}</span>
            </li>
          ))}
        </ol>
        <p className="muted small">Tryk på et trin for at markere det som færdigt.</p>
      </Card>

      {r.tip && (
        <Card title="Tip" icon="💡" tone="soft"><p>{r.tip}</p></Card>
      )}

      <Card title="Hvad syntes I?" icon="⭐">
        <div className="row gap">
          <button className={`btn grow ${op.vote === 'up' ? 'primary' : 'ghost'}`} onClick={() => vote('up')}><Icon name="thumbUp" size={18} /> God</button>
          <button className={`btn grow ${op.vote === 'down' ? 'danger-soft' : 'ghost'}`} onClick={() => vote('down')}><Icon name="thumbDown" size={18} /> Ikke igen</button>
        </div>
        <textarea className="input" rows={2} placeholder="Noter, fx 'mere hvidløg næste gang'" value={op.text || ''} onChange={(e) => put('recipeNotes', id, { ...op, text: e.target.value })} />
      </Card>

      <div className="row gap wrap">
        <button className="btn primary grow" onClick={() => setPickDate(true)}><Icon name="calendar" size={18} /> Sæt på madplanen</button>
        {r.custom && <button className="btn ghost" onClick={() => go(`/opskrift-ret/${r.id}`)}><Icon name="edit" size={18} /> Ret</button>}
        {r.custom && <button className="btn ghost" onClick={() => setConfirmDel(true)}><Icon name="trash" size={18} /></button>}
      </div>

      <Sheet open={pickDate} onClose={() => setPickDate(false)} title="Hvilken dag?">
        <div className="list">
          {dates.map((d) => {
            const cur = getRecipe(get('plan', d)?.recipeId);
            return (
              <button
                key={d}
                className="list-row"
                onClick={() => {
                  put('plan', d, { ...(get('plan', d) || {}), recipeId: r.id, text: '', servings: servings !== s.servings ? servings : undefined });
                  setPickDate(false);
                  showToast(`Sat på ${fmt(d)}`);
                }}
              >
                <span className="grow">
                  <b>{d === today() ? 'I dag' : d === addDays(today(), 1) ? 'I morgen' : cap(fmt(d))}</b>
                  <span className="muted small">{cur ? `Erstatter: ${cur.title}` : get('plan', d)?.text || 'Ikke planlagt'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>

      <Sheet
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Slet opskrift?"
        footer={
          <div className="row gap">
            <button className="btn ghost grow" onClick={() => setConfirmDel(false)}>Annullér</button>
            <button className="btn danger grow" onClick={() => { remove('customRecipes', r.id); back('/plan?v=opskrifter'); }}>Slet</button>
          </div>
        }
      >
        <p>"{r.title}" slettes på alle jeres enheder.</p>
      </Sheet>
      {toast}
      {rating === 0 && <p className="muted small center">Alle faste ingredienser er vurderet "tåles godt". <Rating r={0} size="sm" label={false} /></p>}
    </div>
  );
}
