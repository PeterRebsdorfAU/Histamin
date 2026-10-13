import { useEffect, useRef, useState } from 'react';
import { getSettings, setSettings, getMeta, setMeta, exportAll, importAll, resetAll } from '../lib/db.js';
import { generateSpace, joinSpace, leaveSpace, isValidSpace, syncNow } from '../lib/sync.js';
import { fmt, addDays, today } from '../lib/dates.js';
import { PageHeader, Card, Stepper, Segmented, Sheet, useToast } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

export default function Settings() {
  const s = getSettings();
  const meta = getMeta();
  const [toast, showToast] = useToast();
  const [code, setCode] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [health, setHealth] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  const link = meta.space ? `${location.origin}/#/join/${meta.space}` : '';

  const share = async () => {
    const text = `Tilslut vores lavhistamin-app, så vi deler madplan, hovedpine og mad-tjek:\n${link}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Lavhistamin-app', text, url: link });
      else { await navigator.clipboard.writeText(link); showToast('Linket er kopieret'); }
    } catch { /* annulleret */ }
  };

  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lavhistamin-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const n = importAll(await file.text());
      showToast(`${n} poster importeret`);
    } catch {
      showToast('Filen kunne ikke læses');
    }
    e.target.value = '';
  };

  return (
    <div className="page">
      <PageHeader title="Indstillinger" backTo="/mere" />

      <Card title="Del med din partner" icon="👫">
        {!meta.space ? (
          <>
            <p className="small">
              Del madplan, fryser, hovedpine og mad-tjek mellem jeres telefoner. Data gemmes stadig lokalt på hver telefon, så
              appen virker også uden net.
            </p>
            <button className="btn primary block" onClick={() => { joinSpace(generateSpace(), { create: true }); }}>
              <Icon name="share" size={18} /> Slå deling til
            </button>
            <label className="field-label" htmlFor="jc">Har du fået en kode? Indtast den her</label>
            <div className="row gap">
              <input id="jc" className="input grow" value={code} placeholder="fx dild-mango-k3j9x2a" onChange={(e) => setCode(e.target.value.trim().toLowerCase())} />
              <button className="btn" disabled={!isValidSpace(code)} onClick={() => joinSpace(code)}>Tilslut</button>
            </div>
          </>
        ) : (
          <>
            <p className="small">Send dette link til din partner, og åbn det på den anden telefon:</p>
            <div className="code-box">
              <code>{meta.space}</code>
              <button className="icon-btn sm" onClick={async () => { await navigator.clipboard?.writeText(link); showToast('Linket er kopieret'); }} aria-label="Kopiér"><Icon name="copy" size={18} /></button>
            </div>
            <button className="btn primary block" onClick={share}><Icon name="share" size={18} /> Del link</button>
            <p className="muted small">
              Status: {meta.syncError ? `⚠ ${meta.syncError}` : meta.lastSync ? `Synkroniseret ${new Date(meta.lastSync).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}` : 'Forbinder…'}
              {' · '}<button className="link-btn" onClick={syncNow}>Synk nu</button>
            </p>
            <p className="muted small">Koden er jeres "nøgle" – del den kun med hinanden.</p>
            <button className="btn ghost sm" onClick={() => setConfirmLeave(true)}>Stop deling på denne telefon</button>
          </>
        )}
        {health && health.storage === 'file' && (
          <p className="warn-text small">Serveren kører uden database – delte data kan forsvinde ved genstart. Se README om DATABASE_URL.</p>
        )}
        {health && !health.ok && <p className="muted small">Serveren kan ikke nås lige nu (den kan være ved at vågne). Appen virker fint lokalt imens.</p>}
      </Card>

      <Card title="Forsøget" icon="🧪">
        <label className="field-label" htmlFor="sname">Navn</label>
        <input id="sname" className="input" value={s.name} onChange={(e) => setSettings({ name: e.target.value })} />
        <label className="field-label" htmlFor="sstart">Startdato</label>
        <input id="sstart" type="date" className="input" value={s.startDate || ''} onChange={(e) => e.target.value && setSettings({ startDate: e.target.value })} />
        {s.startDate && <p className="muted small">Slutter {fmt(addDays(s.startDate, s.days - 1))}.</p>}
        <label className="field-label">Varighed</label>
        <Stepper value={s.days} onChange={(v) => setSettings({ days: v })} min={7} max={42} unit="dage" />
        <label className="field-label">Personer til aftensmad</label>
        <Stepper value={s.servings} onChange={(v) => setSettings({ servings: v })} min={1} max={8} unit="pers." />
        <label className="field-label">Hovedpinedage pr. 14 dage før forsøget</label>
        <Stepper value={s.baselineDays} onChange={(v) => setSettings({ baselineDays: v })} min={0} max={14} start={5} unit="dage" />
        <label className="field-label">Typisk styrke før forsøget (0–10)</label>
        <Stepper value={s.baselineIntensity} onChange={(v) => setSettings({ baselineIntensity: v })} min={0} max={10} start={5} />
      </Card>

      <Card title="AI mad-tjek" icon="⚡">
        {health?.ai ? (
          <p className="small">✅ Slået til. Mad-tjek bruger Google Gemini til at vurdere, hvad du har spist.</p>
        ) : (
          <p className="small">
            {health ? '⏸ Ikke slået til på serveren. ' : 'Ukendt (serveren svarer ikke lige nu). '}
            Indtil da laver Mad-tjek et simpelt opslag i fødevarelisten. AI slås til ved at sætte miljøvariablen
            <code> GEMINI_API_KEY</code> på Render (samme type nøgle som i IndkøbsApp).
          </p>
        )}
      </Card>

      <Card title="Udseende" icon="🎨">
        <Segmented
          value={meta.theme || 'auto'}
          onChange={(v) => setMeta({ theme: v || 'auto' })}
          options={[{ value: 'auto', label: 'Automatisk', toggle: false }, { value: 'light', label: 'Lyst', toggle: false }, { value: 'dark', label: 'Mørkt', toggle: false }]}
        />
      </Card>

      <Card title="Installér som app" icon="📱">
        <ul className="small">
          <li><b>iPhone (Safari):</b> Tryk på Del-ikonet → "Føj til hjemmeskærm".</li>
          <li><b>Android (Chrome):</b> Tryk på ⋮ → "Installer app" / "Føj til startskærm".</li>
        </ul>
      </Card>

      <Card title="Data & backup" icon="💾">
        <div className="row gap wrap">
          <button className="btn ghost" onClick={download}><Icon name="download" size={18} /> Eksportér</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}><Icon name="upload" size={18} /> Importér</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        </div>
        <button className="btn danger-soft block" onClick={() => setConfirmReset(true)}><Icon name="trash" size={18} /> Nulstil appen på denne telefon</button>
      </Card>

      <p className="muted small pad">
        Lavhistamin-appen er et privat hjælpeværktøj til et kostforsøg og erstatter ikke lægefaglig rådgivning. Fødevare-vurderingerne er
        vejledende og inspireret af SIGHI-listen.
      </p>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Nulstil appen?"
        footer={
          <div className="row gap">
            <button className="btn ghost grow" onClick={() => setConfirmReset(false)}>Annullér</button>
            <button className="btn danger grow" onClick={resetAll}>Nulstil</button>
          </div>
        }
      >
        <p>Alle data på denne telefon slettes. {meta.space ? 'Delte data på serveren og din partners telefon påvirkes ikke – du kan tilslutte igen med koden.' : 'Overvej at eksportere en backup først.'}</p>
      </Sheet>

      <Sheet
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Stop deling?"
        footer={
          <div className="row gap">
            <button className="btn ghost grow" onClick={() => setConfirmLeave(false)}>Annullér</button>
            <button className="btn primary grow" onClick={() => { leaveSpace(); setConfirmLeave(false); }}>Stop deling</button>
          </div>
        }
      >
        <p>Denne telefon holder op med at synkronisere. Data på telefonen bevares. Gem koden, hvis du vil tilslutte igen: <code>{meta.space}</code></p>
      </Sheet>
      {toast}
    </div>
  );
}
