import { go } from '../lib/router.js';
import { PageHeader } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';

const ITEMS = [
  { to: '/fremskridt', icon: 'chart', label: 'Fremskridt', sub: 'Grafer, uge 1 vs. uge 2 og mønstre' },
  { to: '/rapport', icon: 'print', label: 'Rapport til lægen', sub: 'Udskriv eller gem som PDF' },
  { to: '/plan?v=opskrifter', icon: 'book', label: 'Opskrifter', sub: 'Alle lavhistamin-retter + dine egne' },
  { to: '/plan?v=fryser', icon: 'snow', label: 'Fryseren', sub: 'Hold styr på frosne rester og portioner' },
  { to: '/viden', icon: 'info', label: 'Viden & idéer', sub: 'Histamin, friskhed, rester, morgenmad og frokost' },
  { to: '/viden/laege', icon: 'heart', label: 'Hvornår skal man søge læge?', sub: 'Advarselstegn ved hovedpine' },
  { to: '/efter', icon: 'flag', label: 'Efter de 14 dage', sub: 'Vurdering og genintroduktion' },
  { to: '/indstillinger', icon: 'settings', label: 'Indstillinger & deling', sub: 'Del med partner, startdato, backup' },
];

export default function More() {
  return (
    <div className="page">
      <PageHeader title="Mere" />
      <div className="list menu-list">
        {ITEMS.map((it) => (
          <button key={it.to} className="list-row" onClick={() => go(it.to)}>
            <span className="menu-icon"><Icon name={it.icon} /></span>
            <span className="grow">
              <b>{it.label}</b>
              <span className="muted small">{it.sub}</span>
            </span>
            <Icon name="right" size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
