import { useEffect, useState } from 'react';
import { get } from '../lib/db.js';
import { today, addDays, fmt, cap } from '../lib/dates.js';
import { getRecipe } from '../lib/recipes.js';
import { analyzeText, saveCheck, removeCheck, checksOf, LEVELS, foodName } from '../lib/meal.js';
import { go } from '../lib/router.js';
import { PageHeader, Card, Dot, Rating } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function MealCheck({ date: initialDate }) {
  const t = today();
  const [date, setDate] = useState(initialDate || t);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [ai, setAi] = useState(null);

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((h) => setAi(!!h.ai)).catch(() => setAi(false));
  }, []);

  const log = get('logs', date);
  const checks = checksOf(log);
  const level = log?.histamine ? LEVELS[log.histamine] : null;
  const plan = get('plan', date);
  const dinner = getRecipe(plan?.recipeId)?.title || plan?.text;

  const run = async () => {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setNote(null);
    const result = await analyzeText(q);
    saveCheck(date, q, result);
    setNote(result.note || null);
    setText('');
    setBusy(false);
  };

  return (
    <div className="page">
      <PageHeader title="Mad-tjek" sub="Skriv hvad du har spist – så vurderer AI histamin-indholdet" />

      <div className="segmented">
        {[[t, 'I dag'], [addDays(t, -1), 'I går']].map(([d, label]) => (
          <button key={d} className={date === d ? 'on' : ''} onClick={() => setDate(d)}>{label}</button>
        ))}
        <input
          type="date"
          className="seg-date"
          value={date}
          max={t}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Vælg dato"
        />
      </div>

      <Card>
        <label className="field-label" htmlFor="meal">Hvad har du spist og drukket {date === t ? 'i dag' : fmt(date)}?</label>
        <textarea
          id="meal"
          className="input"
          rows={4}
          value={text}
          placeholder="Fx: Havregrød med blåbær, rugbrød med leverpostej, 2 kopper kaffe, lasagne til aften"
          onChange={(e) => setText(e.target.value)}
        />
        {dinner && !text.includes(dinner) && (
          <button className="chip sm wrap" onClick={() => setText((s) => (s.trim() ? `${s.trim()}, ${dinner}` : dinner))}>
            + Aftensmad fra planen: {dinner}
          </button>
        )}
        <button className="btn primary block" disabled={!text.trim() || busy} onClick={run}>
          {busy ? <><span className="spinner sm" /> Tjekker…</> : <><Icon name="bolt" size={18} /> Tjek histamin</>}
        </button>
        {ai === true && <p className="muted small">Teksten sendes til Google Gemini for at blive vurderet. Skriv ikke personlige oplysninger.</p>}
        {ai === false && <p className="muted small">AI er ikke slået til endnu – appen laver et simpelt opslag i fødevarelisten.</p>}
      </Card>

      {note && <div className="notice warn"><Icon name="info" size={18} /><span>{note}</span></div>}

      {level && (
        <section className={`verdict verdict-${level.r}`}>
          <span className={`rating rating-${level.r} rating-lg`}><span className="rating-dot" />{level.label}</span>
          <p>
            {cap(date === t ? 'i dag' : fmt(date))}: {log.offPlanFoods?.length
              ? `${log.offPlanFoods.length} ting at være opmærksom på.`
              : 'Alt ser fint ud i forhold til forsøget. 👏'}
          </p>
        </section>
      )}

      {[...checks].reverse().map((c) => (
        <Card key={c.id}>
          <div className="check-head">
            <span className="muted small">
              {new Date(c.at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
              {c.source === 'local' ? ' · simpelt opslag' : ' · AI'}
            </span>
            <button className="icon-btn sm" onClick={() => removeCheck(date, c.id)} aria-label="Slet"><Icon name="trash" size={16} /></button>
          </div>
          <p className="check-text">"{c.text}"</p>
          {c.items.length > 0 && (
            <ul className="meal-items">
              {[...c.items].sort((a, b) => b.rating - a.rating).map((it, i) => {
                const reaction = it.foodId && get('foodNotes', it.foodId)?.status === 'reaction';
                return (
                  <li key={i}>
                    <Dot r={reaction ? 3 : it.rating} />
                    <span className="grow">
                      {it.foodId ? (
                        <button className="link-btn plain" onClick={() => go(`/mad/${it.foodId}`)}>{foodName(it)}</button>
                      ) : (
                        <b>{it.name}</b>
                      )}
                      {it.reason && <span className="muted small"> – {it.reason}</span>}
                      {reaction && <span className="mini-badge st-reaction">⚠ Du har reageret på den før</span>}
                    </span>
                    <Rating r={it.rating} size="sm" />
                  </li>
                );
              })}
            </ul>
          )}
          {c.summary && <p className="small">{c.summary}</p>}
          {c.tips?.length > 0 && (
            <div className="tips-box">
              <b className="small">💡 Næste gang</b>
              <ul className="small">{c.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
            </div>
          )}
        </Card>
      ))}

      {checks.length === 0 && (
        <p className="muted small center">
          Du kan tjekke flere gange om dagen – fx efter hvert måltid. Resultatet bruges i Fremskridt til at se, om
          hovedpine følger dage med meget histamin.
        </p>
      )}
    </div>
  );
}
