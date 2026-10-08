import { FOOD_BY_ID, FLAGS, RATINGS, CATEGORIES } from '../data/foods.js';
import { get, put, remove, all } from '../lib/db.js';
import { recipesUsingFood } from '../lib/recipes.js';
import { go } from '../lib/router.js';
import { PageHeader, Rating, Card, Segmented, Empty } from '../components/ui.jsx';

export default function FoodDetail({ id }) {
  const food = FOOD_BY_ID[id];
  if (!food) return <Empty title="Fødevaren findes ikke" />;
  const info = RATINGS[food.r];
  const note = get('foodNotes', id) || {};
  const recipes = recipesUsingFood(id);
  const cat = CATEGORIES.find((c) => c.id === food.cat);
  const flags = food.flags.split(' ').filter(Boolean);
  const tests = all('tests').filter((t) => t.foodId === id).sort((a, b) => a.date.localeCompare(b.date));

  const setNote = (patch) => {
    const next = { ...note, ...patch };
    if (!next.status && !next.text) remove('foodNotes', id);
    else put('foodNotes', id, next);
  };

  return (
    <div className="page">
      <PageHeader title={food.name} sub={`${cat?.icon} ${cat?.label}`} backTo="/mad" />

      <section className={`verdict verdict-${food.r}`}>
        <Rating r={food.r} size="lg" />
        <p>{info.desc}</p>
      </section>

      {food.note && <Card><p>{food.note}</p></Card>}

      {food.alt && (
        <Card title="Godt alternativ" icon="🔄" tone="soft">
          <p>{food.alt}</p>
        </Card>
      )}

      {flags.length > 0 && (
        <Card title="Hvorfor?" icon="🔬">
          <ul className="flag-list">
            {flags.map((fl) => (
              <li key={fl}>
                <span className="flag-chip">{FLAGS[fl].label}</span>
                <span className="small muted">{FLAGS[fl].desc}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Din erfaring" icon="📝">
        <p className="muted small">Har du prøvet den? Notér det – så husker appen det og advarer i opskrifter.</p>
        <Segmented
          value={note.status || null}
          onChange={(v) => setNote({ status: v })}
          options={[
            { value: 'ok', label: '✓ Tåler fint' },
            { value: 'unsure', label: '? Usikker' },
            { value: 'reaction', label: '⚠ Reagerer' },
          ]}
        />
        <textarea
          className="input"
          rows={2}
          placeholder="Fx: Hovedpine 3 timer efter en lille portion"
          value={note.text || ''}
          onChange={(e) => setNote({ text: e.target.value })}
        />
      </Card>

      {recipes.length > 0 && (
        <Card title={`Bruges i ${recipes.length} opskrift${recipes.length > 1 ? 'er' : ''}`} icon="🍲">
          <div className="list">
            {recipes.map((r) => (
              <button key={r.id} className="list-row" onClick={() => go(`/opskrift/${r.id}`)}>
                <span className="grow">{r.title}</span>
                <span className="muted small">{r.time} min</span>
              </button>
            ))}
          </div>
        </Card>
      )}
      {tests.length > 0 && (
        <Card title="Dine genintroduktions-tests" icon="🧪">
          <ul className="plain-list">
            {tests.map((t) => (
              <li key={t.id}>
                <b>{t.date}</b> – {['Ingen reaktion', 'Let reaktion', 'Tydelig reaktion', 'Kraftig reaktion'][t.reaction ?? 0]}
                {t.note ? ` · ${t.note}` : ''}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <button className="btn ghost block" onClick={() => go(`/efter?test=${id}`)}>Test denne fødevare efter forsøget</button>
    </div>
  );
}
