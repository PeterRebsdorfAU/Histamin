import { computeInsights, one, pct } from '../lib/insights.js';
import { getSettings, all } from '../lib/db.js';
import { checksOf, LEVELS } from '../lib/meal.js';
import { fmt, today } from '../lib/dates.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { PageHeader } from '../components/ui.jsx';
import HeadacheChart from '../components/HeadacheChart.jsx';
import Icon from '../components/Icon.jsx';

export default function Report() {
  const s = getSettings();
  const ins = computeInsights();
  const { info, all: st, first, second, baseline } = ins;
  const notes = all('foodNotes').filter((n) => n.status);

  return (
    <div className="page report">
      <div className="no-print">
        <PageHeader title="Rapport" sub="Til lægen eller jer selv" backTo="/fremskridt" />
        <button className="btn primary block" onClick={() => window.print()}><Icon name="print" size={18} /> Udskriv / gem som PDF</button>
      </div>

      <h1 className="print-only">Lavhistamin-forsøg – rapport</h1>
      <p>
        {s.name && <><b>{s.name}</b> · </>}
        Periode: {info.dates.length ? `${fmt(info.dates[0])} – ${fmt(info.endDate)}` : '–'} ({info.total} dage) ·
        Udskrevet {fmt(today())}
      </p>

      <h2>Resumé</h2>
      <ul>
        <li>Dage med noteret hovedpine-status: {st.n}</li>
        <li>Dage med hovedpine: {st.headacheDays} af {st.n}{baseline ? ` (før forsøget: ca. ${baseline.days} af 14)` : ''}</li>
        <li>Gennemsnitlig styrke på hovedpinedage: {one(st.avgIntensity)} / 10{baseline?.intensity != null ? ` (før: ${baseline.intensity})` : ''}</li>
        <li>Første halvdel: {first.headacheDays} af {first.n} dage · Anden halvdel: {second.headacheDays} af {second.n} dage</li>
        <li>Smertestillende i alt: {st.meds}</li>
        <li>Dage med lavt histamin i maden: {ins.lowFoodShare == null ? '–' : `${pct(ins.lowFoodShare)} af ${ins.foodDays} tjekkede dage`}</li>
      </ul>

      <HeadacheChart days={ins.days} total={info.total} half={ins.half} baselineIntensity={baseline?.intensity} />

      <h2>Dag for dag</h2>
      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr><th>Dato</th><th>Hovedpine</th><th>Medicin</th><th>Histamin i maden</th><th>Spist</th><th>Note</th></tr>
          </thead>
          <tbody>
            {ins.days.map((d) => {
              const l = d.log || {};
              const eaten = checksOf(l).map((c) => c.text).join(' · ');
              const bad = (l.offPlanFoods || []).map((f) => FOOD_BY_ID[f]?.name).filter(Boolean).join(', ');
              return (
                <tr key={d.date}>
                  <td>{fmt(d.date, { weekday: false })}</td>
                  <td>{d.logged ? d.h : '–'}{(l.episodes || []).length ? ` (${l.episodes.map((e) => `kl. ${e.time}: ${e.intensity}`).join('; ')})` : ''}</td>
                  <td>{l.meds || ''}</td>
                  <td>{l.histamine ? LEVELS[l.histamine].short : ''}{bad ? `: ${bad}` : ''}</td>
                  <td>{eaten}</td>
                  <td>{l.note || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {notes.length > 0 && (
        <>
          <h2>Egne erfaringer med fødevarer</h2>
          <ul>
            {notes.map((n) => (
              <li key={n.id}>
                {FOOD_BY_ID[n.id]?.name}: {{ ok: 'tåler', reaction: 'reagerer', unsure: 'usikker' }[n.status]}{n.text ? ` – ${n.text}` : ''}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="muted small">
        Kost: lavhistamin-eliminationsdiæt (vejledende vurderinger inspireret af SIGHI-listen). Hovedpine er selvrapporteret på en skala 0–10.
        Histamin-niveauet for maden er en automatisk vurdering ud fra det, der er skrevet ind. Rapporten er genereret af et privat
        hjælpeværktøj og er ikke en medicinsk vurdering.
      </p>
    </div>
  );
}
