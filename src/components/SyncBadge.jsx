import { getMeta } from '../lib/db.js';
import { go } from '../lib/router.js';

export default function SyncBadge() {
  const m = getMeta();
  let cls = 'local';
  let label = 'Kun her';
  if (m.space) {
    const pending = Object.keys(m.outbox || {}).length;
    if (m.syncError) { cls = 'error'; label = m.syncError === 'Offline' ? 'Offline' : 'Venter'; }
    else if (pending) { cls = 'pending'; label = 'Gemmer…'; }
    else if (m.lastSync) { cls = 'ok'; label = 'Delt'; }
    else { cls = 'pending'; label = 'Forbinder…'; }
  }
  return (
    <button className={`sync-badge sync-${cls}`} onClick={() => go('/indstillinger')} title="Deling og synkronisering">
      <span className="sync-dot" />
      {label}
    </button>
  );
}
