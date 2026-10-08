import { useState } from 'react';
import { Sheet, HeadacheSlider, Stepper } from './ui.jsx';
import { get, put, newId } from '../lib/db.js';
import { nowTime } from '../lib/dates.js';
import { HEADACHE_LABELS } from '../data/guide.js';

// Hurtig registrering af en hovedpine-episode
export default function HeadacheSheet({ open, onClose, date, onSaved }) {
  const [intensity, setIntensity] = useState(4);
  const [time, setTime] = useState(nowTime());
  const [meds, setMeds] = useState(0);
  const [note, setNote] = useState('');

  const save = () => {
    const log = get('logs', date) || {};
    const episodes = [...(log.episodes || []), { id: newId(), time, intensity, note: note.trim() }];
    put('logs', date, {
      ...log,
      episodes,
      headache: Math.max(intensity, Number.isFinite(log.headache) ? log.headache : 0),
      meds: (Number(log.meds) || 0) + meds,
    });
    setNote('');
    setMeds(0);
    onSaved?.();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrér hovedpine"
      footer={<button className="btn primary block" onClick={save}>Gem</button>}
    >
      <label className="field-label">Hvor ondt gør det? <b>{intensity}</b> – {HEADACHE_LABELS[intensity]}</label>
      <HeadacheSlider value={intensity} onChange={setIntensity} />

      <div className="grid2">
        <div>
          <label className="field-label" htmlFor="h-time">Hvornår startede den?</label>
          <input id="h-time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Smertestillende</label>
          <Stepper value={meds} onChange={setMeds} min={0} max={10} unit="stk." />
        </div>
      </div>

      <label className="field-label" htmlFor="h-note">Note (hvor sidder den, hvad spiste du sidst…)</label>
      <textarea id="h-note" className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fx bag øjnene, efter frokost" />
    </Sheet>
  );
}
