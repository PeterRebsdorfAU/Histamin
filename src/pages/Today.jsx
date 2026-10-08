import { useState } from 'react';
import { get, put, getSettings } from '../lib/db.js';
import { today, addDays, fmt, cap } from '../lib/dates.js';
import { trialInfo, headacheOf, isLogged, dayComplete } from '../lib/insights.js';
import { getRecipe, thawText, recipeRating } from '../lib/recipes.js';
import { searchFoods, FOOD_BY_ID } from '../data/foods.js';
import { DAILY_HABITS, HEADACHE_LABELS } from '../data/guide.js';
import { go } from '../lib/router.js';
import { Card, Rating, Dot, Check, Stepper, ProgressRing, headColor } from '../components/ui.jsx';
import HeadacheSheet from '../components/HeadacheSheet.jsx';
import Icon from '../components/Icon.jsx';
import { TIPS } from '../data/tips.js';

export default function Today() {
  const s = getSettings();
  const t = today();
  const info = trialInfo();
  const log = get('logs', t) || {};
  const [q, setQ] = useState('');
  const [hOpen, setHOpen] = useState(false);

  const tonight = get('plan', t);
  const tonightRecipe = getRecipe(tonight?.recipeId);
  const tomorrow = get('plan', addDays(t, 1));
  const tomorrowRecipe = getRecipe(tomorrow?.recipeId);
  const thaw = thawText(tomorrowRecipe);
  const freshMeat = tomorrowRecipe?.ingredients?.find((i) => !i.opt && FOOD_BY_ID[i.f]?.cat === 'kod');

  const results = q.trim() ? searchFoods(q).slice(0, 6) : [];
  const h = headacheOf(log);
  const setLog = (patch) => put('logs', t, { ...log, ...patch });
  const habits = log.habits || {};
  const tip = TIPS[Math.abs(info.dayNo || new Date().getDate()) % TIPS.length];

  return (
    <div className="page">
      {/* Status for forsøget */}
      <section className="hero">
        <div>
          <p className="hero-kicker">{cap(fmt(t))}</p>
          {!info.started && <h1>Forsøget starter om {info.daysUntil} {info.daysUntil === 1 ? 'dag' : 'dage'}</h1>}
          {info.started && !info.finished && <h1>Dag {info.dayNo} af {info.total}{s.name ? `, ${s.name}` : ''}</h1>}
          {info.finished && <h1>Forsøget er gennemført! 🎉</h1>}
          <p className="hero-sub">
            {!info.started && 'Brug tiden på at handle ind og fylde fryseren.'}
            {info.started && !info.finished && phaseText(info.dayNo, info.total)}
            {info.finished && 'Se resultatet, og læs om næste skridt.'}
          </p>
          {info.finished && (
            <div className="row gap">
              <button className="btn primary sm" onClick={() => go('/fremskridt')}>Se resultatet</button>
              <button className="btn ghost sm" onClick={() => go('/efter')}>Næste skridt</button>
            </div>
          )}
        </div>
        {info.started && !info.finished && (
          <ProgressRing value={info.dayNo / info.total} size={72}>
            <b>{info.dayNo}</b>
            <small>/{info.total}</small>
          </ProgressRing>
        )}
      </section>

      {/* Må jeg spise? */}
      <div className="search-big">
        <Icon name="search" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Må jeg spise …?"
          aria-label="Søg i fødevarer"
          onKeyDown={(e) => e.key === 'Enter' && q.trim() && go(`/mad?q=${encodeURIComponent(q)}`)}
        />
        {q && <button className="icon-btn sm" onClick={() => setQ('')} aria-label="Ryd"><Icon name="x" size={18} /></button>}
      </div>
      {q.trim() && (
        <div className="quick-results">
          {results.length === 0 && <p className="muted small pad">Ingen fødevarer fundet. Prøv et andet ord.</p>}
          {results.map((f) => (
            <button key={f.id} className="list-row" onClick={() => go(`/mad/${f.id}`)}>
              <span className="grow">{f.name}</span>
              <Rating r={f.r} size="sm" />
            </button>
          ))}
          {results.length > 0 && <button className="link-btn pad" onClick={() => go(`/mad?q=${encodeURIComponent(q)}`)}>Se alle resultater →</button>}
        </div>
      )}

      {/* Hovedpine */}
      <Card title="Hovedpine i dag" icon="🧠" action={<button className="link-btn" onClick={() => go(`/dagbog/${t}`)}>Dagbog →</button>}>
        <div className="headache-today">
          <div className="h-score" style={{ '--c': headColor(h) }}>
            <b>{h ?? '–'}</b>
            <small>{h != null ? HEADACHE_LABELS[h] : 'Ikke registreret'}</small>
          </div>
          <div className="grow">
            <button className="btn danger-soft block" onClick={() => setHOpen(true)}>
              <Icon name="bolt" size={18} /> Jeg har hovedpine nu
            </button>
            {!isLogged(log) && (
              <button className="btn ghost block" onClick={() => setLog({ headache: 0 })}>
                <Icon name="check" size={18} /> Ingen hovedpine i dag
              </button>
            )}
          </div>
        </div>
        {(log.episodes || []).length > 0 && (
          <ul className="episodes">
            {log.episodes.map((e) => (
              <li key={e.id}>
                <span className="ep-dot" style={{ background: headColor(e.intensity) }} />
                kl. {e.time} · styrke {e.intensity}{e.note ? ` · ${e.note}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Aftensmad */}
      <Card title="Aftensmad i aften" icon="🍽️" action={<button className="link-btn" onClick={() => go('/plan')}>Madplan →</button>}>
        {tonightRecipe ? (
          <button className="recipe-hero" onClick={() => go(`/opskrift/${tonightRecipe.id}?dato=${t}`)}>
            <Dot r={recipeRating(tonightRecipe)} />
            <div className="grow">
              <b>{tonightRecipe.title}</b>
              <span className="muted small"><Icon name="clock" size={14} /> {tonightRecipe.time} min · {tonight.servings || s.servings} pers.</span>
            </div>
            <Icon name="right" />
          </button>
        ) : null}
        {tonightRecipe && thawText(tonightRecipe) && (
          <p className="muted small">
            ❄️ Kræver optøet {thawText(tonightRecipe)}. Glemt det? Læg den i en tæt pose i koldt vand i ca. 1 time.
          </p>
        )}
        {tonightRecipe ? null : tonight?.text ? (
          <p><b>{tonight.text}</b></p>
        ) : (
          <div className="row gap">
            <p className="muted grow">Intet planlagt endnu.</p>
            <button className="btn sm" onClick={() => go('/plan')}>Vælg ret</button>
          </div>
        )}
      </Card>

      {/* Forbered til i morgen */}
      {(thaw || freshMeat || tomorrowRecipe) && (
        <Card title="Forbered til i morgen" icon="⏰" tone="info">
          {tomorrowRecipe && <p className="small">I morgen: <b>{tomorrowRecipe.title}</b></p>}
          {thaw && (
            <p className="prep-line"><Icon name="snow" size={18} /> Tag <b>{thaw}</b> op af fryseren i aften, og lad det tø op i køleskabet.</p>
          )}
          {freshMeat && (
            <p className="prep-line"><Icon name="cart" size={18} /> Køb <b>{(freshMeat.n || FOOD_BY_ID[freshMeat.f].name).toLowerCase()}</b> i morgen (eller tag frosset op i aften).</p>
          )}
          {!thaw && !freshMeat && <p className="muted small">Ingen særlig forberedelse – tjek bare, at I har ingredienserne.</p>}
        </Card>
      )}

      {/* Daglige vaner */}
      {info.started && (
        <Card title="Dagens gode vaner" icon="✅">
          <div className="water">
            <span><Icon name="drop" size={18} /> Vand (glas à 2,5 dl)</span>
            <Stepper value={log.water ?? 0} onChange={(v) => setLog({ water: v })} min={0} max={20} />
          </div>
          <div className="water-bar"><span style={{ width: `${Math.min(100, ((log.water || 0) / 7) * 100)}%` }} /></div>
          {DAILY_HABITS.filter((x) => x.id !== 'vand').map((hb) => (
            <Check key={hb.id} checked={habits[hb.id]} onChange={(v) => setLog({ habits: { ...habits, [hb.id]: v } })}>
              {hb.label}
            </Check>
          ))}
        </Card>
      )}

      {/* Dagbog-påmindelse */}
      {info.started && !dayComplete(log) && (
        <button className="cta-card" onClick={() => go(`/dagbog/${t}`)}>
          <span className="cta-icon">📓</span>
          <span className="grow">
            <b>Udfyld dagens dagbog</b>
            <small>Søvn, symptomer, mad og stress – tager ca. 1 minut.</small>
          </span>
          <Icon name="right" />
        </button>
      )}

      {/* Dagens tip */}
      <Card title="Dagens tip" icon="💡" tone="soft">
        <p>{tip}</p>
      </Card>

      <div className="link-grid">
        <button onClick={() => go('/fremskridt')}><Icon name="chart" /> Fremskridt</button>
        <button onClick={() => go('/viden')}><Icon name="info" /> Viden & idéer</button>
        <button onClick={() => go('/plan?v=fryser')}><Icon name="snow" /> Fryseren</button>
        <button onClick={() => go('/efter')}><Icon name="flag" /> Efter forsøget</button>
      </div>

      <HeadacheSheet open={hOpen} onClose={() => setHOpen(false)} date={t} />
    </div>
  );
}

function phaseText(day, total) {
  if (day <= 2) return 'De første dage handler om at komme godt i gang. Effekten kommer typisk først om nogle dage.';
  if (day <= 4) return 'Kroppen "tømmer spanden". Hold fast – mange mærker først forskel fra dag 5.';
  if (day <= total - 3) return 'Godt gået! Nu begynder det at vise sig, om kosten gør en forskel.';
  return 'Sidste stræk! Bliv ved med at udfylde dagbogen – de sidste dage er vigtige data.';
}
