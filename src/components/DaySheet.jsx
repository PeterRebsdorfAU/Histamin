import { get, put } from '../lib/db.js';
import { fmt, cap } from '../lib/dates.js';
import { headacheOf } from '../lib/insights.js';
import { LEVELS } from '../lib/meal.js';
import { HEADACHE_LABELS } from '../data/guide.js';
import { go } from '../lib/router.js';
import { Sheet, HeadacheSlider, Stepper, headColor } from './ui.jsx';
import Icon from './Icon.jsx';

// Ret hovedpine for en bestemt dag (fx hvis man glemte det i går).
export default function DaySheet({ date, onClose }) {
  if (!date) return null;
  const log = get('logs', date) || {};
  const set = (patch) => put('logs', date, { ...log, ...patch });
  const h = headacheOf(log);
  const episodes = log.episodes || [];

  return (
    <Sheet open={!!date} onClose={onClose} title={cap(fmt(date))}>
      <label className="field-label">
        Dagens værste hovedpine: <b style={{ color: headColor(h) }}>{h ?? '–'}</b> {h != null && `– ${HEADACHE_LABELS[h]}`}
      </label>
      <HeadacheSlider value={log.headache ?? h ?? 0} onChange={(v) => set({ headache: v })} />
      {h == null && (
        <button className="btn ghost sm" onClick={() => set({ headache: 0 })}><Icon name="check" size={16} /> Ingen hovedpine</button>
      )}

      {episodes.length > 0 && (
        <ul className="episodes">
          {episodes.map((e) => (
            <li key={e.id}>
              <span className="ep-dot" style={{ background: headColor(e.intensity) }} />
              <span className="grow">kl. {e.time} · styrke {e.intensity}{e.note ? ` · ${e.note}` : ''}</span>
              <button className="icon-btn sm" onClick={() => set({ episodes: episodes.filter((x) => x.id !== e.id) })} aria-label="Slet"><Icon name="x" size={14} /></button>
            </li>
          ))}
        </ul>
      )}

      <div className="field-row">
        <span>💊 Smertestillende</span>
        <Stepper value={log.meds ?? 0} onChange={(v) => set({ meds: v })} min={0} max={20} unit="stk." />
      </div>

      <label className="field-label" htmlFor="dnote">Note</label>
      <input id="dnote" className="input" value={log.note || ''} placeholder="Fx menstruation, dårlig søvn, stresset dag" onChange={(e) => set({ note: e.target.value })} />

      <button className="btn ghost block" onClick={() => { onClose(); go(`/spist?dato=${date}`); }}>
        <Icon name="bolt" size={18} /> {log.histamine ? `Mad: ${LEVELS[log.histamine].label}` : 'Tjek hvad du spiste'}
      </button>
    </Sheet>
  );
}
