import { GUIDE, IDEAS } from '../data/guide.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { PageHeader, Card, Dot } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Guide({ open }) {
  return (
    <div className="page">
      <PageHeader title="Viden & idéer" sub="Det vigtigste om histamin – og hvad man kan spise" backTo="/" />

      {GUIDE.map((g) => (
        <details key={g.id} className={`guide ${g.danger ? 'guide-danger' : ''}`} open={open === g.id || undefined}>
          <summary>
            <span className="guide-icon">{g.icon}</span>
            <span className="grow">{g.title}</span>
            <Icon name="plus" size={18} className="guide-chev" />
          </summary>
          <div className="guide-body">
            {(g.body || []).map((p, i) => <p key={i}>{p}</p>)}
            {g.list && <ul>{g.list.map((li, i) => <li key={i}>{li}</li>)}</ul>}
            {(g.after || []).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </details>
      ))}

      <h2 className="section-title">Idéer til resten af dagen</h2>
      <p className="muted small">Aftensmaden står i madplanen. Her er forslag til morgenmad, frokost og mellemmåltider. Prikkerne viser ingrediensernes histamin-vurdering.</p>
      {Object.entries(IDEAS).map(([id, sec]) => (
        <Card key={id} title={sec.label} icon={sec.icon}>
          <div className="list">
            {sec.items.map((it) => (
              <div key={it.title} className="list-row static">
                <span className="grow">
                  {it.title}
                  {it.foods.length > 0 && (
                    <span className="idea-foods">
                      {it.foods.map((f) => <Dot key={f} r={FOOD_BY_ID[f]?.r} />)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <p className="muted small pad">
        Indholdet er samlet fra offentligt tilgængelige råd om lavhistamin-kost og er ment som hjælp til et kostforsøg – ikke som
        medicinsk rådgivning. Tal med din læge, hvis du er i tvivl.
      </p>
    </div>
  );
}
