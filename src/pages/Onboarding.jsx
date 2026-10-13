import { useState } from 'react';
import { getMeta, setSettings } from '../lib/db.js';
import { today, addDays, range, fmt, fromKey, toKey } from '../lib/dates.js';
import { generatePlan } from '../lib/planner.js';
import { isValidSpace, joinSpace, leaveSpace } from '../lib/sync.js';
import { Stepper, Toggle } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const nextMonday = () => {
  const d = fromKey(today());
  const add = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + add);
  return toKey(d);
};

export default function Onboarding() {
  const meta = getMeta();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [start, setStart] = useState(today());
  const [servings, setServings] = useState(2);
  const [baseDays, setBaseDays] = useState(null);
  const [baseInt, setBaseInt] = useState(null);
  const [autoPlan, setAutoPlan] = useState(true);
  const [code, setCode] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  // Tilsluttet en partners delingskode – venter på data
  if (meta.space && !meta.lastSync) {
    return (
      <div className="onboard">
        <div className="onboard-card center">
          <div className="spinner" />
          <h1>Henter jeres fælles data…</h1>
          <p className="muted">
            Serveren kan være op til et minut om at vågne, hvis ingen har brugt appen i et stykke tid.
          </p>
          {meta.syncError && <p className="warn-text">Status: {meta.syncError}. Vi prøver igen automatisk.</p>}
          <button className="btn ghost" onClick={leaveSpace}>Annullér og start selv</button>
        </div>
      </div>
    );
  }

  const finish = () => {
    setSettings({
      name: name.trim(),
      startDate: start,
      days: 14,
      servings,
      baselineDays: baseDays,
      baselineIntensity: baseInt,
      onboarded: true,
    });
    if (autoPlan) generatePlan(range(start, 14));
  };

  const steps = [
    // 0 – velkommen
    <div key="0">
      <div className="onboard-hero">🌿</div>
      <h1>14 dage med lavhistamin</h1>
      <p>
        Appen hjælper jer gennem et kostforsøg, hvor I spiser så lidt histamin som muligt i 14 dage – og ser, om
        hovedpinen bliver mindre.
      </p>
      <ul className="feature-list">
        <li><span>🔍</span> Slå op, om en fødevare er ok</li>
        <li><span>📅</span> Færdig madplan med 27 lavhistamin-retter</li>
        <li><span>⚡</span> Skriv hvad du har spist – AI tjekker histamin</li>
        <li><span>🧠</span> Notér hovedpine med ét tryk</li>
        <li><span>📈</span> Overblik over, om det virker</li>
        <li><span>👫</span> Del på tværs af jeres telefoner</li>
      </ul>
      <div className="notice">
        <Icon name="info" size={18} />
        <span>Appen er et hjælpeværktøj – ikke medicinsk rådgivning. Tal med lægen om vedvarende hovedpine.</span>
      </div>
      <button className="btn primary block" onClick={() => setStep(1)}>Kom i gang</button>
      {!joinOpen ? (
        <button className="btn ghost block" onClick={() => setJoinOpen(true)}>Jeg har en delingskode fra min partner</button>
      ) : (
        <div className="join-box">
          <label className="field-label" htmlFor="code">Delingskode</label>
          <div className="row">
            <input id="code" className="input" value={code} placeholder="fx dild-mango-k3j9x2a" onChange={(e) => setCode(e.target.value.trim().toLowerCase())} />
            <button className="btn primary" disabled={!isValidSpace(code)} onClick={() => joinSpace(code)}>Tilslut</button>
          </div>
        </div>
      )}
    </div>,

    // 1 – opsætning
    <div key="1">
      <h1>Opsætning</h1>
      <label className="field-label" htmlFor="name">Hvem er forsøgsperson? (valgfrit)</label>
      <input id="name" className="input" value={name} placeholder="Fornavn" onChange={(e) => setName(e.target.value)} />

      <label className="field-label">Hvornår starter de 14 dage?</label>
      <div className="chips">
        <button className={`chip ${start === today() ? 'on' : ''}`} onClick={() => setStart(today())}>I dag</button>
        <button className={`chip ${start === addDays(today(), 1) ? 'on' : ''}`} onClick={() => setStart(addDays(today(), 1))}>I morgen</button>
        <button className={`chip ${start === nextMonday() ? 'on' : ''}`} onClick={() => setStart(nextMonday())}>Næste mandag</button>
      </div>
      <input type="date" className="input" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
      <p className="muted small">Forsøget løber fra {fmt(start)} til {fmt(addDays(start, 13))}.</p>

      <label className="field-label">Hvor mange spiser med til aftensmad?</label>
      <Stepper value={servings} onChange={setServings} min={1} max={8} unit="pers." />

      <div className="row gap">
        <button className="btn ghost" onClick={() => setStep(0)}>Tilbage</button>
        <button className="btn primary grow" onClick={() => setStep(2)}>Næste</button>
      </div>
    </div>,

    // 2 – baseline
    <div key="2">
      <h1>Hvordan er det nu?</h1>
      <p className="muted">
        For at kunne se, om forsøget virker, skal vi vide, hvordan det typisk har været. Tænk på de sidste 14 dage.
      </p>
      <label className="field-label">Hvor mange af de sidste 14 dage har der været hovedpine?</label>
      <Stepper value={baseDays} onChange={setBaseDays} min={0} max={14} start={5} unit="dage" />

      <label className="field-label">Hvor kraftig er den typisk? (0–10)</label>
      <Stepper value={baseInt} onChange={setBaseInt} min={0} max={10} start={5} />
      <p className="muted small">0 = ingen, 5 = moderat, 10 = værst tænkelige. Kan ændres senere.</p>

      <div className="row gap">
        <button className="btn ghost" onClick={() => setStep(1)}>Tilbage</button>
        <button className="btn primary grow" onClick={() => setStep(3)}>Næste</button>
      </div>
    </div>,

    // 3 – madplan
    <div key="3">
      <h1>Klar til start 🎉</h1>
      <Toggle checked={autoPlan} onChange={setAutoPlan} label="Lav en færdig madplan for alle 14 dage" />
      <p className="muted small">
        Varieret med fisk ca. 2 gange om ugen og hurtige retter på hverdage. I kan bytte retter ud når som helst.
      </p>
      <div className="tips-box">
        <h3>Gode råd inden I starter</h3>
        <ul>
          <li>Køb fisk på frost – og frys kød, I ikke bruger samme dag.</li>
          <li>Hold kaffeforbruget som normalt (abstinenser giver hovedpine).</li>
          <li>Drop alkohol i de 14 dage.</li>
          <li>Notér hovedpine hver dag – også når der ikke er nogen.</li>
          <li>Rester: spis inden for et døgn, eller frys straks.</li>
        </ul>
      </div>
      <div className="row gap">
        <button className="btn ghost" onClick={() => setStep(2)}>Tilbage</button>
        <button className="btn primary grow" onClick={finish}>Start forsøget</button>
      </div>
    </div>,
  ];

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-steps">
          {[0, 1, 2, 3].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}
        </div>
        {steps[step]}
      </div>
    </div>
  );
}
