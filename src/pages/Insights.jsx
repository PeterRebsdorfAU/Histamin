import { computeInsights, pct, one } from '../lib/insights.js';
import { go } from '../lib/router.js';
import { PageHeader, Card, Empty, Dot, headColor } from '../components/ui.jsx';
import HeadacheChart from '../components/HeadacheChart.jsx';
import Icon from '../components/Icon.jsx';
import { fromKey } from '../lib/dates.js';

export default function Insights() {
  const ins = computeInsights();
  const { info, logged, all, first, second, baseline } = ins;

  if (!info.started) {
    return (
      <div className="page">
        <PageHeader title="Fremskridt" backTo="/" />
        <Empty icon="📈" title="Forsøget er ikke startet endnu">
          <p className="muted small">Når I er i gang og har udfyldt dagbogen et par dage, kommer grafer og mønstre her.</p>
        </Empty>
      </div>
    );
  }

  const scaled = baseline && all.n ? (all.headacheDays / all.n) * 14 : null;

  return (
    <div className="page">
      <PageHeader
        title="Fremskridt"
        sub={`${logged.length} af ${Math.min(info.dayNo, info.total)} dage udfyldt`}
        backTo="/"
        right={<button className="icon-btn" onClick={() => go('/rapport')} aria-label="Rapport"><Icon name="print" /></button>}
      />

      <Card title="Hovedpine pr. dag" icon="🧠">
        <HeadacheChart days={ins.days} total={info.total} half={ins.half} baselineIntensity={baseline?.intensity} />
        <div className="chart-legend small muted">
          <span><i className="lg-dot" style={{ background: 'var(--r0)' }} /> ingen</span>
          <span><i className="lg-dot" style={{ background: headColor(2) }} /> let</span>
          <span><i className="lg-dot" style={{ background: headColor(5) }} /> moderat</span>
          <span><i className="lg-dot" style={{ background: headColor(8) }} /> kraftig</span>
          <span><i className="lg-dot" style={{ background: 'var(--period)' }} /> menstruation</span>
          <span><b>!</b> afveg fra kosten</span>
        </div>
      </Card>

      {logged.length < 3 ? (
        <Empty icon="⏳" title="Lidt flere dage, så kommer tallene">
          <p className="muted small">Udfyld dagbogen mindst 3 dage for at se statistik.</p>
        </Empty>
      ) : (
        <>
          <div className="kpis">
            <div className="kpi">
              <span className="kpi-val">{all.headacheDays}<small>/{all.n}</small></span>
              <span className="kpi-label">dage med hovedpine</span>
              {baseline && <span className="kpi-cmp">Før: {baseline.days}/14{scaled != null && ` · nu svarer det til ${one(scaled)}/14`}</span>}
            </div>
            <div className="kpi">
              <span className="kpi-val">{one(all.avgIntensity)}</span>
              <span className="kpi-label">gns. styrke på hovedpinedage</span>
              {baseline?.intensity != null && <span className="kpi-cmp">Før: {baseline.intensity}</span>}
            </div>
            <div className="kpi">
              <span className="kpi-val">{all.meds}</span>
              <span className="kpi-label">smertestillende i alt</span>
            </div>
            <div className="kpi">
              <span className="kpi-val">{ins.adherence == null ? '–' : pct(ins.adherence)}</span>
              <span className="kpi-label">dage helt på kosten</span>
            </div>
          </div>

          {baseline && scaled != null && <Verdict baselineDays={baseline.days} scaled={scaled} n={all.n} />}

          <Card title="Første halvdel vs. anden halvdel" icon="⚖️">
            <p className="muted small">Effekten af kosten kommer typisk efter nogle dage – derfor er anden halvdel mest interessant.</p>
            <table className="cmp-table">
              <thead>
                <tr><th /><th>Dag 1–{ins.half}</th><th>Dag {ins.half + 1}–{info.total}</th></tr>
              </thead>
              <tbody>
                <tr><td>Udfyldte dage</td><td>{first.n}</td><td>{second.n}</td></tr>
                <tr><td>Dage med hovedpine</td><td>{first.headacheDays}</td><td>{second.headacheDays}</td></tr>
                <tr><td>Andel</td><td>{first.n ? pct(first.headacheDays / first.n) : '–'}</td><td>{second.n ? pct(second.headacheDays / second.n) : '–'}</td></tr>
                <tr><td>Gns. styrke</td><td>{one(first.avgIntensity)}</td><td>{one(second.avgIntensity)}</td></tr>
                <tr><td>Smertestillende</td><td>{first.meds}</td><td>{second.meds}</td></tr>
                <tr><td>Velbefindende (1–5)</td><td>{one(first.wellbeing)}</td><td>{one(second.wellbeing)}</td></tr>
              </tbody>
            </table>
          </Card>

          <Card title="Andre symptomer" icon="🩺">
            <div className="sym-grid" style={{ '--n': ins.days.length }}>
              {ins.symptomCounts.map((s) => (
                <div key={s.id} className="sym-row">
                  <span className="sym-name" title={s.label}>{s.icon} <span>{s.label}</span></span>
                  <span className="sym-cells">
                    {s.byDay.map((v, i) => <i key={i} className={`sym-cell sv${v}`} title={`${ins.days[i].date}: ${v}`} />)}
                  </span>
                  <span className="sym-count">{s.days}</span>
                </div>
              ))}
              <div className="sym-row axis">
                <span className="sym-name" />
                <span className="sym-cells">{ins.days.map((d) => <i key={d.date} className="sym-cell axis">{fromKey(d.date).getDate()}</i>)}</span>
                <span className="sym-count" />
              </div>
            </div>
          </Card>

          <Card title="Mønstre at holde øje med" icon="🔎">
            <p className="muted small">
              Sammenligner hovedpine på dage med og uden en bestemt faktor. Med så få dage er det kun pejlemærker – ikke beviser.
            </p>
            {ins.patterns.factors.length === 0 && <p className="muted">Ikke nok variation i data endnu.</p>}
            {ins.patterns.factors.map((p) => (
              <div key={p.label} className="pattern">
                <div className="pattern-head">
                  <b>{p.label}</b>
                  {p.diff >= 0.25 && p.withN >= 2 && <span className="mini-badge st-reaction">Mulig sammenhæng</span>}
                </div>
                <div className="pattern-bars">
                  <Bar label={`Med (${p.withN} d.)`} v={p.withRate} strong />
                  <Bar label={`Uden (${p.withoutN} d.)`} v={p.withoutRate} />
                </div>
                {p.hint && <span className="muted small">{p.hint}</span>}
              </div>
            ))}
            {ins.patterns.foods.length > 0 && (
              <>
                <h3 className="sub-title">Fødevarer spist uden for planen</h3>
                <ul className="plain-list">
                  {ins.patterns.foods.map((f) => (
                    <li key={f.foodId}>
                      <Dot r={f.food.r} /> <b>{f.food.name}</b> – {f.times} gang{f.times > 1 ? 'e' : ''}, hovedpine samme/næste dag {f.followed} gang{f.followed !== 1 ? 'e' : ''}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </>
      )}

      <div className="row gap">
        <button className="btn primary grow" onClick={() => go('/rapport')}><Icon name="print" size={18} /> Rapport til lægen</button>
        <button className="btn ghost grow" onClick={() => go('/efter')}><Icon name="flag" size={18} /> Næste skridt</button>
      </div>
    </div>
  );
}

function Bar({ label, v, strong }) {
  return (
    <div className="pbar">
      <span className="pbar-label small">{label}</span>
      <span className="pbar-track"><span className={`pbar-fill ${strong ? 'strong' : ''}`} style={{ width: `${Math.round(v * 100)}%` }} /></span>
      <span className="pbar-val small">{pct(v)}</span>
    </div>
  );
}

function Verdict({ baselineDays, scaled, n }) {
  if (n < 7) {
    return (
      <div className="notice">
        <Icon name="info" size={18} />
        <span>Det er for tidligt at konkludere. De første dage tæller mindre – vent til efter dag 7.</span>
      </div>
    );
  }
  const change = baselineDays ? (baselineDays - scaled) / baselineDays : 0;
  if (baselineDays > 0 && change >= 0.5) {
    return (
      <div className="notice good">
        <span className="big-emoji">🎉</span>
        <span>Markant færre hovedpinedage end før forsøget (ca. {Math.round(change * 100)} % færre). Det tyder på, at kosten gør en forskel.</span>
      </div>
    );
  }
  if (baselineDays > 0 && change >= 0.25) {
    return (
      <div className="notice good">
        <span className="big-emoji">👍</span>
        <span>Noget færre hovedpinedage end før (ca. {Math.round(change * 100)} %). Kig også på styrken og anden halvdel af forsøget.</span>
      </div>
    );
  }
  return (
    <div className="notice">
      <Icon name="info" size={18} />
      <span>Indtil videre ingen tydelig forskel i antal hovedpinedage. Se også styrke, andre symptomer og mønstrene nedenfor.</span>
    </div>
  );
}
