import { headColor } from './ui.jsx';
import { fromKey } from '../lib/dates.js';

// Søjlediagram: hovedpine (0–10) pr. dag i forsøget.
export default function HeadacheChart({ days, total, half, baselineIntensity }) {
  const W = 340;
  const H = 150;
  const padL = 22;
  const padB = 22;
  const n = Math.max(total, days.length);
  const bw = (W - padL) / n;
  const y = (v) => H - padB - (v / 10) * (H - padB - 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Hovedpine pr. dag">
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W} y1={y(v)} y2={y(v)} className="grid-line" />
          <text x={padL - 6} y={y(v) + 4} className="axis-text" textAnchor="end">{v}</text>
        </g>
      ))}
      {half && half < n && <line x1={padL + half * bw} x2={padL + half * bw} y1={4} y2={H - padB} className="half-line" />}
      {baselineIntensity != null && (
        <g>
          <line x1={padL} x2={W} y1={y(baselineIntensity)} y2={y(baselineIntensity)} className="base-line" />
          <text x={W - 2} y={y(baselineIntensity) - 4} className="axis-text" textAnchor="end">typisk før</text>
        </g>
      )}
      {days.map((d, i) => {
        const x = padL + i * bw + bw * 0.15;
        const w = bw * 0.7;
        const v = d.logged ? d.h ?? 0 : null;
        return (
          <g key={d.date}>
            {v == null ? (
              <rect x={x} y={H - padB - 3} width={w} height={3} rx={1.5} fill="var(--surface-3)" />
            ) : v === 0 ? (
              <circle cx={x + w / 2} cy={H - padB - 4} r={Math.min(4, w / 2)} fill="var(--r0)" />
            ) : (
              <rect x={x} y={y(v)} width={w} height={H - padB - y(v)} rx={Math.min(4, w / 3)} fill={headColor(v)} />
            )}
            {d.histamine && d.histamine !== 'lav' && (
              <text x={x + w / 2} y={10} textAnchor="middle" className={`mark-text ${d.histamine === 'høj' ? 'high' : ''}`}>!</text>
            )}
            {(i % 2 === 0 || n <= 14) && (
              <text x={x + w / 2} y={H - padB + 11} textAnchor="middle" className="axis-text">{fromKey(d.date).getDate()}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
