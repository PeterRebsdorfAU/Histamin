import { computeInsights, pct, one } from '../lib/insights.js';
import { go } from '../lib/router.js';
import { PageHeader, Card, Empty, Dot, headColor } from '../components/ui.jsx';
import HeadacheChart from '../components/HeadacheChart.jsx';
import Icon from '../components/Icon.jsx';

export default function Insights() {
  const ins = computeInsights();
  const { info, logged, all, first, second, baseline } = ins;

  if (!info.started) {
    return (
      <div className="page">
        <PageHeader title="Fremskridt" backTo="/" />
        <Empty icon="📈" title="Forsøget er ikke startet endnu">
          <p className="muted small">Når I er i gang og har noteret hovedpine et par dage, kommer grafer og mønstre her.</p>
        </Empty>
      </div>
    );
  }

  const scaled = baseline && all.n ? (all.headacheDays / all.n) * 14 : null;
  const p = ins.patterns.histamine;

  return (
    <div className="page">
      <PageHeader
        title="Fremskridt"
        sub={`Hovedpine noteret ${logged.length} af ${Math.min(info.dayNo, info.total)} dage`}
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
          <span><b className="mark-legend">!</b> meget histamin i maden</span>
        </div>
      </Card>

      {logged.length < 3 ? (
        <Empty icon="⏳" title="Lidt flere dage, så kommer tallene">
          <p className="muted small">Notér hovedpine (eller "ingen hovedpine") mindst 3 dage for at se statistik.</p>
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
              <span className="kpi-val">{ins.lowFoodShare == null ? '–' : pct(ins.lowFoodShare)}</span>
              <span className="kpi-label">dage med lavt histamin i maden</span>
              {ins.foodDays > 0 && <span className="kpi-cmp">ud af {ins.foodDays} tjekkede dage</span>}
            </div>
          </div>

          {baseline && scaled != null && <Verdict baselineDays={baseline.days} scaled={scaled} n={all.n} />}

          <Card title="Første vs. anden halvdel" icon="⚖️">
            <p className="muted small">Effekten af kosten kommer typisk efter nogle dage – derfor er anden halvdel mest interessant.</p>
            <table className="cmp-table">
              <thead>
                <tr><th /><th>Dag 1–{ins.half}</th><th>Dag {ins.half + 1}–{info.total}</th></tr>
              </thead>
              <tbody>
                <tr><td>Noterede dage</td><td>{first.n}</td><td>{second.n}</td></tr>
                <tr><td>Dage med hovedpine</td><td>{first.headacheDays}</td><td>{second.headacheDays}</td></tr>
                <tr><td>Andel</td><td>{first.n ? pct(first.headacheDays / first.n) : '–'}</td><td>{second.n ? pct(second.headacheDays / second.n) : '–'}</td></tr>
                <tr><td>Gns. styrke</td><td>{one(first.avgIntensity)}</td><td>{one(second.avgIntensity)}</td></tr>
                <tr><td>Smertestillende</td><td>{first.meds}</td><td>{second.meds}</td></tr>
              </tbody>
            </table>
          </Card>

          <Card title="Maden og hovedpinen" icon="🔎">
            {!p && ins.patterns.foods.length === 0 ? (
              <p className="muted small">
                Brug <button className="link-btn" onClick={() => go('/spist')}>Mad-tjek</button> et par dage – så kan appen
                sammenligne hovedpine efter dage med lavt og højt histamin.
              </p>
            ) : (
              <>
                <p className="muted small">Hovedpine samme dag eller dagen efter. Med så få dage er det pejlemærker – ikke beviser.</p>
                {p && (
                  <div className="pattern">
                    <div className="pattern-head">
                      <b>Dage med middel/højt histamin</b>
                      {p.withRate - p.withoutRate >= 0.25 && p.withN >= 2 && <span className="mini-badge st-reaction">Mulig sammenhæng</span>}
                    </div>
                    <div className="pattern-bars">
                      <Bar label={`Højt (${p.withN} d.)`} v={p.withRate} strong />
                      <Bar label={`Lavt (${p.withoutN} d.)`} v={p.withoutRate} />
                    </div>
                  </div>
                )}
                {ins.patterns.foods.length > 0 && (
                  <>
                    <h3 className="sub-title">Problematiske fødevarer I har spist</h3>
                    <ul className="plain-list">
                      {ins.patterns.foods.map((f) => (
                        <li key={f.foodId}>
                          <Dot r={f.food.r} /> <b>{f.food.name}</b> – {f.times} gang{f.times > 1 ? 'e' : ''}, fulgt af hovedpine {f.followed} gang{f.followed !== 1 ? 'e' : ''}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
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
      <span>Indtil videre ingen tydelig forskel i antal hovedpinedage. Se også styrken og anden halvdel.</span>
    </div>
  );
}
