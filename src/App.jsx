import { useEffect } from 'react';
import { useRoute, go } from './lib/router.js';
import { useDb, getSettings, getMeta } from './lib/db.js';
import { isValidSpace, joinSpace } from './lib/sync.js';
import Icon from './components/Icon.jsx';
import SyncBadge from './components/SyncBadge.jsx';

import Onboarding from './pages/Onboarding.jsx';
import Today from './pages/Today.jsx';
import Foods from './pages/Foods.jsx';
import FoodDetail from './pages/FoodDetail.jsx';
import Plan from './pages/Plan.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import RecipeEditor from './pages/RecipeEditor.jsx';
import MealCheck from './pages/MealCheck.jsx';
import Insights from './pages/Insights.jsx';
import Report from './pages/Report.jsx';
import Guide from './pages/Guide.jsx';
import After from './pages/After.jsx';
import More from './pages/More.jsx';
import Settings from './pages/Settings.jsx';

const TABS = [
  { id: 'idag', label: 'I dag', icon: 'home', match: ['', 'idag'] },
  { id: 'spist', label: 'Mad-tjek', icon: 'bolt', match: ['spist'] },
  { id: 'mad', label: 'Fødevarer', icon: 'search', match: ['mad'] },
  { id: 'plan', label: 'Madplan', icon: 'calendar', match: ['plan', 'opskrift', 'opskrift-ny', 'opskrift-ret'] },
];

export default function App() {
  useDb();
  const { parts, query } = useRoute();
  const settings = getSettings();
  const meta = getMeta();
  const [p0, p1] = parts;

  // Tema
  useEffect(() => {
    const t = meta.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }, [meta.theme]);

  // Delingslink: #/join/<kode>
  useEffect(() => {
    if (p0 === 'join' && isValidSpace(p1)) {
      if (meta.space !== p1) joinSpace(p1);
      go('/');
    }
  }, [p0, p1, meta.space]);

  if (p0 === 'join') return null;
  if (!settings.onboarded) return <Onboarding />;

  let page;
  switch (p0) {
    case undefined:
    case 'idag': page = <Today />; break;
    case 'mad': page = p1 ? <FoodDetail id={p1} /> : <Foods initialQuery={query.get('q') || ''} />; break;
    case 'plan': page = <Plan view={query.get('v') || 'plan'} />; break;
    case 'opskrift': page = <RecipeDetail id={p1} planDate={query.get('dato')} />; break;
    case 'opskrift-ny': page = <RecipeEditor />; break;
    case 'opskrift-ret': page = <RecipeEditor id={p1} />; break;
    case 'spist': page = <MealCheck date={query.get('dato')} />; break;
    case 'fremskridt': page = <Insights />; break;
    case 'rapport': page = <Report />; break;
    case 'viden': page = <Guide open={p1} />; break;
    case 'efter': page = <After testFood={query.get('test')} />; break;
    case 'mere': page = <More />; break;
    case 'indstillinger': page = <Settings />; break;
    default: page = <Today />;
  }

  const activeTab = TABS.find((t) => t.match.includes(p0 ?? ''))?.id;

  return (
    <div className="app">
      <header className="topbar no-print">
        <button className="brand" onClick={() => go('/')}>
          <span className="brand-mark"><Icon name="leaf" size={18} /></span>
          <span>Lavhistamin</span>
        </button>
        <div className="topbar-right">
          <SyncBadge />
          <button className={`icon-btn ${p0 === 'mere' ? 'active' : ''}`} onClick={() => go('/mere')} aria-label="Mere">
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <main className="content" key={p0 || 'idag'}>{page}</main>

      <nav className="tabbar no-print" aria-label="Hovedmenu">
        {TABS.map((t) => (
          <button key={t.id} className={activeTab === t.id ? 'active' : ''} onClick={() => go(`/${t.id}`)} aria-current={activeTab === t.id ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
