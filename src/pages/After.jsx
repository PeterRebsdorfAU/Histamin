import { useState } from 'react';
import { FOOD_BY_ID, FOODS } from '../data/foods.js';
import { all, get, put, remove, newId } from '../lib/db.js';
import { today, fmt, addDays } from '../lib/dates.js';
import { computeInsights } from '../lib/insights.js';
import { go } from '../lib/router.js';
import { PageHeader, Card, Dot, Segmented, Sheet } from '../components/ui.jsx';
import FoodInput from '../components/FoodInput.jsx';
import Icon from '../components/Icon.jsx';

const REACTIONS = ['Ingen reaktion', 'Let reaktion', 'Tydelig reaktion', 'Kraftig reaktion'];

// Forslag til rækkefølge: start med det, der er mest "værd" at få tilbage, og som er mindst risikabelt.
const SUGGESTED = ['yoghurt', 'aeg', 'svinekoed', 'peberfrugt', 'rugbroed', 'banan', 'appelsin', 'ung-ost', 'tomat', 'chokolade'];

export default function After({ testFood }) {
  const ins = computeInsights();
  const tests = all('tests').sort((a, b) => b.date.localeCompare(a.date));
  const [open, setOpen] = useState(!!testFood);
  const [foodId, setFoodId] = useState(testFood || null);
  const [q, setQ] = useState('');
  const [date, setDate] = useState(today());
  const [reaction, setReaction] = useState(null);
  const [note, setNote] = useState('');
  const [editId, setEditId] = useState(null);

  const last = tests[0];
  const nextOk = last ? addDays(last.date, 3) : today();

  const startNew = (fid = null) => {
    setEditId(null); setFoodId(fid); setQ(''); setDate(today()); setReaction(null); setNote(''); setOpen(true);
  };
  const editTest = (t) => {
    setEditId(t.id); setFoodId(t.foodId); setDate(t.date); setReaction(t.reaction ?? null); setNote(t.note || ''); setOpen(true);
  };
  const save = () => {
    if (!foodId) return;
    const id = editId || newId();
    put('tests', id, { foodId, date, reaction, note: note.trim() });
    // Opdatér "Din erfaring" på fødevaren, når der er en vurdering
    if (reaction != null) {
      const cur = get('foodNotes', foodId) || {};
      put('foodNotes', foodId, { ...cur, status: reaction === 0 ? 'ok' : reaction === 1 ? 'unsure' : 'reaction' });
    }
    setOpen(false);
  };

  const testedIds = new Set(tests.map((t) => t.foodId));

  return (
    <div className="page">
      <PageHeader title="Efter de 14 dage" sub="Sådan finder I ud af, hvad der kan tåles" backTo="/" />

      <Card title="1. Vurdér resultatet" icon="⚖️">
        <p>Sammenlign de sidste ca. 7 dage med, hvordan det var før. Kig på:</p>
        <ul>
          <li>Antal dage med hovedpine og hvor kraftig den var</li>
          <li>Forbrug af smertestillende</li>
          <li>De andre symptomer (næse, mave, rødme, træthed)</li>
        </ul>
        <button className="btn ghost sm" onClick={() => go('/fremskridt')}><Icon name="chart" size={16} /> Se jeres tal</button>
        {ins.logged.length >= 7 && ins.baseline && (
          <p className="small muted">
            Til sammenligning: {ins.all.headacheDays} af {ins.all.n} udfyldte dage med hovedpine – før: ca. {ins.baseline.days} af 14.
          </p>
        )}
      </Card>

      <Card title="2a. Blev det tydeligt bedre?" icon="✅" tone="soft">
        <p>Så er histamin sandsynligvis en del af forklaringen. Næste skridt er at <b>genintroducere</b> fødevarer én ad gangen for at finde ud af, hvad og hvor meget der kan tåles. Målet er en så varieret kost som muligt – ikke en livslang streng diæt.</p>
        <p>Tal gerne med lægen eller en klinisk diætist om resultatet.</p>
      </Card>

      <Card title="2b. Ingen tydelig forskel?" icon="🤔">
        <p>Så er histamin nok ikke hovedårsagen til hovedpinen. Gå til lægen, og medbring rapporten – den viser hovedpinen dag for dag og hvad der er spist.</p>
        <button className="btn ghost sm" onClick={() => go('/rapport')}><Icon name="print" size={16} /> Rapport til lægen</button>
      </Card>

      <Card title="3. Sådan genintroducerer du" icon="🧪">
        <ol className="numbered">
          <li>Fortsæt med lavhistamin-kosten som grundlag.</li>
          <li>Vælg <b>én</b> fødevare. Spis en normal portion – gerne 1–2 gange samme dag.</li>
          <li>Vent 2–3 dage, og notér hovedpine som normalt. Reaktioner kan komme forsinket.</li>
          <li>Ingen reaktion → den må gerne komme tilbage i kosten. Reaktion → vent, til symptomerne er væk, før næste test.</li>
          <li>Test ikke på dage med ekstra stress, sygdom eller menstruation – det giver usikre svar.</li>
          <li>Start med fødevarer markeret gul/"Små mængder", før de røde.</li>
        </ol>
      </Card>

      <Card
        title="Testlog"
        icon="📋"
        action={<button className="btn primary sm" onClick={() => startNew()}><Icon name="plus" size={16} /> Ny test</button>}
      >
        {last && <p className="small muted">Næste test anbefales tidligst {nextOk <= today() ? 'i dag' : fmt(nextOk)}.</p>}
        {tests.length === 0 ? (
          <>
            <p className="muted small">Ingen tests endnu. Forslag til at starte med:</p>
            <div className="chips">
              {SUGGESTED.map((id) => (
                <button key={id} className="chip sm" onClick={() => startNew(id)}><Dot r={FOOD_BY_ID[id].r} /> {FOOD_BY_ID[id].name}</button>
              ))}
            </div>
          </>
        ) : (
          <div className="list">
            {tests.map((t) => {
              const f = FOOD_BY_ID[t.foodId];
              return (
                <button key={t.id} className="list-row" onClick={() => editTest(t)}>
                  <Dot r={f?.r} />
                  <span className="grow">
                    <b>{f?.name || t.foodId}</b>
                    <span className="muted small">{fmt(t.date)}{t.note ? ` · ${t.note}` : ''}</span>
                  </span>
                  <span className={`mini-badge ${t.reaction == null ? '' : t.reaction === 0 ? 'st-ok' : 'st-reaction'}`}>
                    {t.reaction == null ? 'Afventer' : REACTIONS[t.reaction]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {tests.length > 0 && (
          <div className="chips">
            {SUGGESTED.filter((id) => !testedIds.has(id)).slice(0, 6).map((id) => (
              <button key={id} className="chip sm" onClick={() => startNew(id)}>+ {FOOD_BY_ID[id].name}</button>
            ))}
          </div>
        )}
      </Card>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'Ret test' : 'Ny test'}
        footer={
          <div className="row gap">
            {editId && <button className="btn ghost" onClick={() => { remove('tests', editId); setOpen(false); }}><Icon name="trash" size={18} /></button>}
            <button className="btn primary grow" disabled={!foodId} onClick={save}>Gem</button>
          </div>
        }
      >
        <label className="field-label">Fødevare</label>
        {foodId ? (
          <div className="current-pick">
            <Dot r={FOOD_BY_ID[foodId]?.r} />
            <b className="grow">{FOOD_BY_ID[foodId]?.name}</b>
            <button className="link-btn" onClick={() => setFoodId(null)}>Skift</button>
          </div>
        ) : (
          <FoodInput value={q} onChange={setQ} onPick={(f) => setFoodId(f.id)} placeholder="Søg fødevare…" autoFocus />
        )}
        <label className="field-label" htmlFor="tdate">Dato for test</label>
        <input id="tdate" type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <label className="field-label">Reaktion (udfyld efter 2–3 dage)</label>
        <Segmented
          size="sm"
          value={reaction}
          onChange={setReaction}
          options={REACTIONS.map((label, i) => ({ value: i, label: label.replace(' reaktion', '') }))}
        />
        <label className="field-label" htmlFor="tnote">Note</label>
        <textarea id="tnote" className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mængde, symptomer, hvornår…" />
      </Sheet>

      <p className="muted small pad">{FOODS.length} fødevarer i listen · Personlige noter gemmes på hver fødevare under "Din erfaring".</p>
    </div>
  );
}
