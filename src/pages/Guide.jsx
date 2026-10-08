import { GUIDE, IDEAS } from '../data/guide.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { put, newId, all } from '../lib/db.js';
import { PageHeader, Card, Dot, useToast } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Guide({ open }) {
  const [toast, showToast] = useToast();

  const addToShop = (idea) => {
    const existing = new Set(all('shopManual').filter((m) => !m.checked).map((m) => m.foodId));
    const add = idea.foods.filter((f) => !existing.has(f));
    add.forEach((f, i) => put('shopManual', newId() + i, { name: FOOD_BY_ID[f].name, foodId: f, checked: false, createdAt: Date.now() + i }));
    showToast(add.length ? `${add.length} varer lagt på indkøbslisten` : 'Varerne er allerede på listen');
  };

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
      <p className="muted small">Aftensmaden står i madplanen. Her er forslag til morgenmad, frokost og mellemmåltider – tryk + for at lægge ingredienserne på indkøbslisten.</p>
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
                {it.foods.length > 0 && (
                  <button className="icon-btn sm" onClick={() => addToShop(it)} aria-label="Læg på indkøbslisten"><Icon name="plus" size={18} /></button>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <p className="muted small pad">
        Indholdet er samlet fra offentligt tilgængelige råd om lavhistamin-kost og er ment som hjælp til et kostforsøg – ikke som
        medicinsk rådgivning. Tal med din læge, hvis du er i tvivl.
      </p>
      {toast}
    </div>
  );
}
