import { useState } from 'react';
import { get, put, getSettings } from '../lib/db.js';
import { today, addDays, fmt, cap, range, fromKey, weekdayShort } from '../lib/dates.js';
import { trialInfo, headacheOf, isLogged } from '../lib/insights.js';
import { getRecipe, thawText, recipeRating } from '../lib/recipes.js';
import { LEVELS } from '../lib/meal.js';
import { searchFoods } from '../data/foods.js';
import { HEADACHE_LABELS } from '../data/guide.js';
import { go } from '../lib/router.js';
import { Card, Rating, Dot, ProgressRing, headColor } from '../components/ui.jsx';
import HeadacheSheet from '../components/HeadacheSheet.jsx';
import DaySheet from '../components/DaySheet.jsx';
import Icon from '../components/Icon.jsx';

export default function Today() {
  const s = getSettings();
  const t = today();
  const info = trialInfo();
  const log = get('logs', t) || {};
  const [q, setQ] = useState('');
  const [hOpen, setHOpen] = useState(false);
  const [editDay, setEditDay] = useState(null);

  const tonight = get('plan', t);
  const tonightRecipe = getRecipe(tonight?.recipeId);
  const results = q.trim() ? searchFoods(q).slice(0, 6) : [];
  const h = headacheOf(log);
  const level = log.histamine ? LEVELS[log.histamine] : null;
  const last7 = range(addDays(t, -6), 7);

  return (
    <div className="page">
      {/* Status for forsøget */}
      <section className="hero">
        <div>
          <p className="hero-kicker">{cap(fmt(t))}</p>
          {!info.started && <h1>Forsøget starter om {info.daysUntil} {info.daysUntil === 1 ? 'dag' : 'dage'}</h1>}
          {info.started && !info.finished && <h1>Dag {info.dayNo} af {info.total}{s.name ? `, ${s.name}` : ''}</h1>}
          {info.finished && <h1>Forsøget er gennemført! 🎉</h1>}
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
          {results.length === 0 && <p className="muted small pad">Ingen fødevarer fundet. Prøv Mad-tjek i stedet.</p>}
          {results.map((f) => (
            <button key={f.id} className="list-row" onClick={() => go(`/mad/${f.id}`)}>
              <span className="grow">{f.name}</span>
              <Rating r={f.r} size="sm" />
            </button>
          ))}
        </div>
      )}

      {/* Hovedpine */}
      <Card title="Hovedpine i dag" icon="🧠">
        <div className="headache-today">
          <div className="h-score" style={{ '--c': headColor(h) }}>
            <b>{h ?? '–'}</b>
            <small>{h != null ? HEADACHE_LABELS[h] : 'Ikke registreret'}</small>
          </div>
          <div className="grow">
            <button className="btn danger-soft block" onClick={() => setHOpen(true)}>
              <Icon name="bolt" size={18} /> Jeg har hovedpine nu
            </button>
            {!isLogged(log) ? (
              <button className="btn ghost block" onClick={() => put('logs', t, { ...log, headache: 0 })}>
                <Icon name="check" size={18} /> Ingen hovedpine i dag
              </button>
            ) : (
              <button className="btn ghost block" onClick={() => setEditDay(t)}>
                <Icon name="edit" size={18} /> Ret
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

        <div className="week-strip" aria-label="Seneste 7 dage">
          {last7.map((d) => {
            const l = get('logs', d);
            const hv = isLogged(l) ? headacheOf(l) : null;
            return (
              <button key={d} className={`week-day ${d === t ? 'today' : ''}`} onClick={() => setEditDay(d)} title={fmt(d)}>
                <span className="week-wd">{weekdayShort(d)}</span>
                <span className="h-pill" style={{ '--c': headColor(hv) }}>{hv ?? '–'}</span>
                <span className="week-food">{l?.histamine ? <Dot r={LEVELS[l.histamine].r} /> : <span className="dot-empty" />}</span>
                <span className="week-date">{fromKey(d).getDate()}</span>
              </button>
            );
          })}
        </div>
        <p className="muted small">Tryk på en dag for at rette. Prikken under viser maden den dag.</p>
      </Card>

      {/* Mad i dag */}
      <button className="cta-card" onClick={() => go('/spist')}>
        <span className="cta-icon">{level ? level.emoji : '🍽️'}</span>
        <span className="grow">
          <b>{level ? `Maden i dag: ${level.label.toLowerCase()}` : 'Hvad har du spist i dag?'}</b>
          <small>{level ? 'Tryk for at se detaljer eller tilføje mere.' : 'Skriv det med dine egne ord – AI vurderer histamin-indholdet.'}</small>
        </span>
        <Icon name="right" />
      </button>

      {/* Aftensmad */}
      <Card title="Aftensmad i aften" icon="🍲" action={<button className="link-btn" onClick={() => go('/plan')}>Madplan →</button>}>
        {tonightRecipe ? (
          <button className="recipe-hero" onClick={() => go(`/opskrift/${tonightRecipe.id}?dato=${t}`)}>
            <Dot r={recipeRating(tonightRecipe)} />
            <div className="grow">
              <b>{tonightRecipe.title}</b>
              <span className="muted small"><Icon name="clock" size={14} /> {tonightRecipe.time} min · {tonight.servings || s.servings} pers.</span>
            </div>
            <Icon name="right" />
          </button>
        ) : tonight?.text ? (
          <p><b>{tonight.text}</b></p>
        ) : (
          <div className="row gap">
            <p className="muted grow">Intet planlagt endnu.</p>
            <button className="btn sm" onClick={() => go('/plan')}>Vælg ret</button>
          </div>
        )}
        {tonightRecipe && thawText(tonightRecipe) && (
          <p className="muted small">❄️ Kræver optøet {thawText(tonightRecipe)}. Glemt det? Læg den i en tæt pose i koldt vand i ca. 1 time.</p>
        )}
      </Card>

      <HeadacheSheet open={hOpen} onClose={() => setHOpen(false)} date={t} />
      <DaySheet date={editDay} onClose={() => setEditDay(null)} />
    </div>
  );
}
