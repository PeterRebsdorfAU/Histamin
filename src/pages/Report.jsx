import { computeInsights, one, pct } from '../lib/insights.js';
import { getSettings, all } from '../lib/db.js';
import { fmt, today } from '../lib/dates.js';
import { SYMPTOMS } from '../data/guide.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { PageHeader } from '../components/ui.jsx';
import HeadacheChart from '../components/HeadacheChart.jsx';
import Icon from '../components/Icon.jsx';

const SEV = ['', 'let', 'mod.', 'kraftig'];
const PLAN = { ja: 'Ja', delvist: 'Delvist', nej: 'Nej' };

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
        <li>Udfyldte dage: {st.n}</li>
        <li>Dage med hovedpine: {st.headacheDays} af {st.n}{baseline ? ` (før forsøget: ca. ${baseline.days} af 14)` : ''}</li>
        <li>Gennemsnitlig styrke på hovedpinedage: {one(st.avgIntensity)} / 10{baseline?.intensity != null ? ` (før: ${baseline.intensity})` : ''}</li>
        <li>Første halvdel: {first.headacheDays} af {first.n} dage · Anden halvdel: {second.headacheDays} af {second.n} dage</li>
        <li>Smertestillende i alt: {st.meds}</li>
        <li>Dage helt på kosten: {ins.adherence == null ? '–' : pct(ins.adherence)}</li>
      </ul>

      <HeadacheChart days={ins.days} total={info.total} half={ins.half} baselineIntensity={baseline?.intensity} />

      <h2>Dag for dag</h2>
      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>Dato</th><th>Hovedpine</th><th>Medicin</th><th>Symptomer</th><th>Søvn</th><th>Stress</th><th>Vand</th><th>Mens.</th><th>På kost</th><th>Noter</th>
            </tr>
          </thead>
          <tbody>
            {ins.days.map((d) => {
              const l = d.log || {};
              const sy = SYMPTOMS.filter((x) => l.symptoms?.[x.id]).map((x) => `${x.label} (${SEV[l.symptoms[x.id]]})`);
              const off = [...(l.offPlanFoods || []).map((f) => FOOD_BY_ID[f]?.name), l.offPlan].filter(Boolean).join(', ');
              return (
                <tr key={d.date}>
                  <td>{fmt(d.date, { weekday: false })}</td>
                  <td>{d.logged ? d.h : '–'}{(l.episodes || []).length ? ` (${l.episodes.map((e) => `kl. ${e.time}: ${e.intensity}`).join('; ')})` : ''}</td>
                  <td>{l.meds ? `${l.meds}${l.medsName ? ` ${l.medsName}` : ''}` : ''}</td>
                  <td>{sy.join(', ')}</td>
                  <td>{l.sleepHours != null ? `${String(l.sleepHours).replace('.', ',')} t` : ''}</td>
                  <td>{l.stress ?? ''}</td>
                  <td>{l.water ?? ''}</td>
                  <td>{l.period ? '●' : ''}</td>
                  <td>{PLAN[l.onPlan] || ''}{off ? `: ${off}` : ''}</td>
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
        Rapporten er genereret af et privat hjælpeværktøj og er ikke en medicinsk vurdering.
      </p>
    </div>
  );
}
