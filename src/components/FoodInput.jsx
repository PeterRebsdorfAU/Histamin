import { useState } from 'react';
import { searchFoods } from '../data/foods.js';
import { Dot } from './ui.jsx';

// Tekstfelt med forslag fra fødevarelisten. onPick(food) når et forslag vælges.
export default function FoodInput({ value, onChange, onPick, placeholder, onEnter, autoFocus }) {
  const [focus, setFocus] = useState(false);
  const sugg = focus && value.trim().length >= 2 ? searchFoods(value).slice(0, 6) : [];
  return (
    <div className="food-input">
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      />
      {sugg.length > 0 && (
        <div className="suggest">
          {sugg.map((f) => (
            <button key={f.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(f); setFocus(false); }}>
              <Dot r={f.r} /> {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
