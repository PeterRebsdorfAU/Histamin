import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { RATINGS } from '../data/foods.js';
import { back } from '../lib/router.js';

export function Rating({ r, size = 'md', label = true }) {
  if (r == null) return <span className="rating rating-x">?</span>;
  const info = RATINGS[r];
  return (
    <span className={`rating rating-${r} rating-${size}`} title={info.desc}>
      <span className="rating-dot" />
      {label && info.label}
    </span>
  );
}

export const Dot = ({ r }) => <span className={`dot dot-${r ?? 'x'}`} aria-label={r != null ? RATINGS[r].label : 'Ukendt'} />;

export function PageHeader({ title, sub, backTo, right }) {
  return (
    <div className="page-header">
      {backTo !== undefined && (
        <button className="icon-btn" onClick={() => back(backTo)} aria-label="Tilbage">
          <Icon name="left" />
        </button>
      )}
      <div className="page-header-text">
        <h1>{title}</h1>
        {sub && <p className="muted small">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ title, icon, action, children, className = '', tone }) {
  return (
    <section className={`card ${tone ? `card-${tone}` : ''} ${className}`}>
      {(title || action) && (
        <div className="card-head">
          <h2>
            {icon && <span className="card-icon">{icon}</span>}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Luk">
            <Icon name="x" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, step = 1, unit, format, start }) {
  const v = value ?? null;
  const show = v == null ? '–' : format ? format(v) : String(v).replace('.', ',');
  const change = (dir) => {
    if (v == null) return onChange(start ?? min);
    onChange(Math.round(Math.min(max, Math.max(min, v + dir * step)) * 100) / 100);
  };
  return (
    <div className="stepper">
      <button type="button" onClick={() => change(-1)} aria-label="Mindre">
        <Icon name="minus" size={18} />
      </button>
      <span className="stepper-val">
        {show}
        {unit && v != null && <small> {unit}</small>}
      </span>
      <button type="button" onClick={() => change(1)} aria-label="Mere">
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}

export function Segmented({ options, value, onChange, size }) {
  return (
    <div className={`segmented ${size === 'sm' ? 'segmented-sm' : ''}`} role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(value === o.value && o.toggle !== false ? null : o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Scale({ value, onChange, labels, emojis }) {
  return (
    <div className="scale">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} className={value === n ? 'on' : ''} onClick={() => onChange(value === n ? null : n)} aria-label={labels?.[n - 1] || String(n)}>
          {emojis ? emojis[n - 1] : n}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      <span>{label}</span>
    </label>
  );
}

export function Check({ checked, onChange, children }) {
  return (
    <label className={`check ${checked ? 'checked' : ''}`}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="check-box"><Icon name="check" size={16} stroke={3} /></span>
      <span className="check-label">{children}</span>
    </label>
  );
}

export function HeadacheSlider({ value, onChange }) {
  const v = value ?? 0;
  return (
    <div className="hslider">
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--p': `${v * 10}%`, '--c': headColor(v) }}
        aria-label="Hovedpine-styrke"
      />
      <div className="hslider-scale"><span>0 Ingen</span><span>5</span><span>10 Værst</span></div>
    </div>
  );
}

export const headColor = (v) => {
  if (v == null) return 'var(--surface-3)';
  if (v === 0) return 'var(--r0)';
  if (v <= 3) return 'var(--h-low)';
  if (v <= 6) return 'var(--r2)';
  return 'var(--r3)';
};

export function Empty({ icon = '🌱', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [node, setMsg];
}

export function ProgressRing({ value, size = 64, stroke = 7, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--accent)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}
