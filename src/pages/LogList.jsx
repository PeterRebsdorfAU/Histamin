import { get } from '../lib/db.js';
import { today, range, weekdayShort, fromKey, fmt, addDays, diffDays } from '../lib/dates.js';
import { trialInfo, headacheOf, isLogged, dayComplete } from '../lib/insights.js';
import { SYMPTOMS } from '../data/guide.js';
import { go } from '../lib/router.js';
import { PageHeader, headColor } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function LogList() {
  const t = today();
  const info = trialInfo();
  // Vis forsøgets dage + evt. dage før/efter som allerede har data
  const dates = info.dates.length ? info.dates : range(addDays(t, -6), 7);
  const shown = [...dates].reverse();
  const extraAfter = info.finished ? range(addDays(info.endDate, 1), Math.min(14, diffDays(info.endDate, t))) : [];

  return (
    <div className="page">
      <PageHeader title="Dagbog" sub="Ét minut hver aften giver svaret efter 14 dage" />

      <button className="cta-card" onClick={() => go(`/dagbog/${t}`)}>
        <span className="cta-icon">✍️</span>
        <span className="grow">
          <b>{dayComplete(get('logs', t)) ? 'Se/ret dagens dagbog' : 'Udfyld dagens dagbog'}</b>
          <small>{fmt(t)}</small>
        </span>
        <Icon name="right" />
      </button>

      <div className="log-strip">
        {dates.map((d) => {
          const h = headacheOf(get('logs', d));
          return (
            <button key={d} className={`strip-day ${d === t ? 'today' : ''} ${d > t ? 'future' : ''}`} onClick={() => d <= t && go(`/dagbog/${d}`)} disabled={d > t}>
              <span className="strip-bar" style={{ '--c': headColor(h), height: `${h == null ? 6 : 10 + h * 6}px` }} />
              <span className="strip-label">{fromKey(d).getDate()}</span>
            </button>
          );
        })}
      </div>
      <p className="muted small center">Søjlerne viser hovedpine-styrke pr. dag (grå = ikke udfyldt)</p>

      <div className="list">
        {[...extraAfter.reverse(), ...shown].filter((d) => d <= t).map((d) => {
          const log = get('logs', d);
          const h = headacheOf(log);
          const sy = SYMPTOMS.filter((s) => (log?.symptoms?.[s.id] || 0) > 0);
          const dayNo = info.dates.indexOf(d) + 1;
          return (
            <button key={d} className="list-row log-row" onClick={() => go(`/dagbog/${d}`)}>
              <span className="log-date">
                <span>{weekdayShort(d)}</span>
                <b>{fromKey(d).getDate()}</b>
              </span>
              <span className="grow">
                <span>
                  {dayNo > 0 && <span className="muted small">Dag {dayNo} · </span>}
                  {isLogged(log) ? (h > 0 ? `Hovedpine ${h}/10` : 'Ingen hovedpine') : <span className="muted">Ikke udfyldt</span>}
                </span>
                <span className="muted small">
                  {sy.map((s) => s.icon).join(' ')}
                  {log?.period ? ' 🩸' : ''}
                  {log?.onPlan === 'nej' || log?.onPlan === 'delvist' ? ' · afveg fra kosten' : ''}
                  {log?.meds ? ` · ${log.meds} pille${log.meds > 1 ? 'r' : ''}` : ''}
                </span>
              </span>
              <span className="h-pill" style={{ '--c': headColor(isLogged(log) ? h : null) }}>{isLogged(log) ? h : '–'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
