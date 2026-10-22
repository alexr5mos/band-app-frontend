// src/pages/SongStructure.jsx
// Section-by-section song structure: ordered sections with bar counts and
// chords, a proportional timeline, and song length worked out from the BPM.
// Sections with the same name share their chords unless unlinked, and custom
// sections can be added by name. Saved as JSON in song_details.structure;
// older plain-text structures ("Verse • Chorus • ...") are converted to
// sections when opened.

import { useState } from 'react';

export const SECTION_TYPES = [
  { type: 'Intro', bars: 4, color: 'bg-slate-500' },
  { type: 'Verse', bars: 16, color: 'bg-sky-600' },
  { type: 'Pre-Chorus', bars: 8, color: 'bg-violet-600' },
  { type: 'Chorus', bars: 8, color: 'bg-brand-600' },
  { type: 'Bridge', bars: 8, color: 'bg-amber-600' },
  { type: 'Solo', bars: 8, color: 'bg-emerald-600' },
  { type: 'Breakdown', bars: 8, color: 'bg-teal-700' },
  { type: 'Outro', bars: 4, color: 'bg-slate-500' },
];

const OTHER_COLOR = 'bg-fuchsia-700';
const BEATS_PER_BAR = 4;

function typeInfo(type) {
  return SECTION_TYPES.find((t) => t.type === type);
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function matchType(name) {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  const aliases = { prechorus: 'Pre-Chorus', pre: 'Pre-Chorus', refrain: 'Chorus', middle: 'Bridge', middleeight: 'Bridge' };
  if (aliases[key]) return aliases[key];
  const found = SECTION_TYPES.find((t) => t.type.toLowerCase().replace(/[^a-z]/g, '') === key);
  return found ? found.type : null;
}

// Sections of the same kind ("Verse", or a custom name) share chords.
function kindOf(section) {
  return section.label || section.type;
}

// Turns whatever is stored in song_details.structure into a list of sections.
export function parseStructure(raw) {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sections)) {
      const firstChords = {};
      return parsed.sections.map((s) => {
        const section = {
          id: s.id || newId(),
          type: s.type || 'Other',
          label: s.label || '',
          bars: Number(s.bars) > 0 ? Number(s.bars) : 4,
          chords: s.chords || '',
        };
        // Songs saved before linking existed: keep sections whose chords
        // already differ from the first of their kind independent.
        const kind = kindOf(section);
        if (section.chords && firstChords[kind] === undefined) firstChords[kind] = section.chords;
        section.linked = s.linked !== undefined
          ? s.linked !== false
          : !section.chords || firstChords[kind] === section.chords;
        return section;
      });
    }
  } catch {
    // Not JSON: an older plain-text structure, handled below.
  }
  return raw
    .split(/[•,\n→>|]+|\s[-–—]\s/)
    .map((part) => part.trim().replace(/\s*x\d+$/i, '').replace(/\s*\d+$/, ''))
    .filter(Boolean)
    .map((name) => {
      const type = matchType(name);
      return {
        id: newId(),
        type: type || 'Other',
        label: type ? '' : name,
        bars: type ? typeInfo(type).bars : 8,
        chords: '',
        linked: true,
      };
    });
}

export function serializeStructure(sections) {
  if (!sections.length) return '';
  return JSON.stringify({
    version: 1,
    sections: sections.map(({ id, type, label, bars, chords, linked }) => ({ id, type, label, bars, chords, linked })),
  });
}

// "Verse 1", "Verse 2"... only numbered when a type appears more than once.
function sectionNames(sections) {
  const totals = {};
  sections.forEach((s) => {
    const name = kindOf(s);
    totals[name] = (totals[name] || 0) + 1;
  });
  const seen = {};
  return sections.map((s) => {
    const name = kindOf(s);
    seen[name] = (seen[name] || 0) + 1;
    return totals[name] > 1 ? `${name} ${seen[name]}` : name;
  });
}

function formatLength(totalBars, bpm) {
  const n = Number(bpm);
  if (!n || n <= 0) return null;
  const seconds = Math.round((totalBars * BEATS_PER_BAR * 60) / n);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// Song length ("3:24") from a stored structure, or null without a BPM.
export function songLength(raw, bpm) {
  const totalBars = parseStructure(raw).reduce((sum, s) => sum + s.bars, 0);
  return totalBars ? formatLength(totalBars, bpm) : null;
}

function colorFor(section) {
  return typeInfo(section.type)?.color || OTHER_COLOR;
}

// Wraps onto several lines at a fixed scale (16 bars per line on phones,
// 32 on wider screens) so section names stay readable.
function Timeline({ sections, names }) {
  const total = sections.reduce((sum, s) => sum + s.bars, 0);
  if (!total) return null;
  return (
    <div className="flex flex-wrap gap-y-1 w-full [--bars-per-line:16] sm:[--bars-per-line:32]">
      {sections.map((s, i) => (
        <div
          key={s.id}
          className="h-11 p-px"
          style={{ width: `min(100%, calc(${s.bars} * 100% / var(--bars-per-line)))` }}
          title={`${names[i]} · ${s.bars} bars`}
        >
          <div className={`${colorFor(s)} h-full rounded flex flex-col items-center justify-center text-white overflow-hidden px-1 leading-tight`}>
            <span className="text-xs font-semibold truncate max-w-full">{names[i]}</span>
            <span className="text-[10px] opacity-80">{s.bars}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Summary({ sections, bpm }) {
  const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);
  const length = formatLength(totalBars, bpm);
  return (
    <div className="flex gap-4 text-sm text-gray-400">
      <span>{totalBars} bars total</span>
      {length ? <span>⏱ {length} at {bpm} BPM</span> : <span>Add a BPM to see the song length</span>}
    </div>
  );
}

export function structureAsText(sections, bpm) {
  const names = sectionNames(sections);
  const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);
  const length = formatLength(totalBars, bpm);
  const lines = sections.map((s, i) =>
    `${names[i]} (${s.bars} bars)${s.chords.trim() ? `: ${s.chords.trim()}` : ''}`
  );
  lines.push('', `${totalBars} bars${length ? ` · ${length} at ${bpm} BPM` : ''}`);
  return lines.join('\n');
}

// Read-only view shown on the song page.
export function SongStructureView({ raw, bpm, chordSize = 'text-sm' }) {
  const [copied, setCopied] = useState(false);
  const sections = parseStructure(raw);

  if (!sections.length) {
    return (
      <div className="bg-dark-800 border border-dark-700 rounded p-3 text-gray-400">
        No structure yet
      </div>
    );
  }

  const names = sectionNames(sections);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(structureAsText(sections, bpm));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="space-y-3">
      <Timeline sections={sections} names={names} />
      <div className="flex items-center justify-between gap-2">
        <Summary sections={sections} bpm={bpm} />
        <button onClick={handleCopy} className="text-sm text-brand-400 hover:text-brand-300 font-semibold whitespace-nowrap">
          {copied ? '✓ Copied' : 'Copy as text'}
        </button>
      </div>
      <div className="space-y-2">
        {sections.map((s, i) => (
          <div key={s.id} className="bg-dark-800 border border-dark-700 rounded p-3 flex gap-3">
            <div className={`${colorFor(s)} w-1.5 rounded shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{names[i]}</span>
                <span className="text-sm text-gray-400">{s.bars} bars</span>
              </div>
              {s.chords.trim() && (
                <div className={`font-mono ${chordSize} text-gray-200 mt-1 whitespace-pre-wrap break-words`}>{s.chords}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Editor shown while editing a song. `raw` is the stored structure string and
// `onChange` receives the new string to store.
export function SongStructureEditor({ raw, bpm, onChange }) {
  const [sections, setSections] = useState(() => parseStructure(raw));
  const [customName, setCustomName] = useState(null);
  const names = sectionNames(sections);
  const kindCounts = {};
  sections.forEach((s) => { kindCounts[kindOf(s)] = (kindCounts[kindOf(s)] || 0) + 1; });
  const customKinds = [...new Set(sections.filter((s) => s.type === 'Other').map(kindOf))];

  const update = (next) => {
    setSections(next);
    onChange(serializeStructure(next));
  };

  // type is one of SECTION_TYPES, or 'Other' with a custom label.
  const addSection = (type, label = '') => {
    const kind = label || type;
    // A repeated section usually has the same chords, so reuse the linked ones.
    const same = [...sections].reverse().filter((s) => kindOf(s) === kind);
    const source = same.find((s) => s.linked) || same[0];
    update([
      ...sections,
      {
        id: newId(),
        type,
        label,
        bars: source?.bars || typeInfo(type)?.bars || 8,
        chords: source?.linked ? source.chords : '',
        linked: true,
      },
    ]);
  };

  const addCustom = () => {
    const name = (customName || '').trim();
    if (!name) return;
    const type = matchType(name);
    if (type) addSection(type);
    else addSection('Other', name);
    setCustomName(null);
  };

  const patch = (index, changes) => {
    update(sections.map((s, i) => (i === index ? { ...s, ...changes } : s)));
  };

  // Typing chords in a linked section updates every linked section of its kind.
  const setChords = (index, chords) => {
    const edited = sections[index];
    update(sections.map((s, i) => {
      if (i === index) return { ...s, chords };
      if (edited.linked && s.linked && kindOf(s) === kindOf(edited)) return { ...s, chords };
      return s;
    }));
  };

  const toggleLinked = (index) => {
    const edited = sections[index];
    if (edited.linked) {
      patch(index, { linked: false });
      return;
    }
    // Re-linking picks up the chords the other linked sections already share.
    const other = sections.find((s, i) => i !== index && s.linked && kindOf(s) === kindOf(edited));
    patch(index, { linked: true, chords: other ? other.chords : edited.chords });
  };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const remove = (index) => update(sections.filter((_, i) => i !== index));

  const smallButton = 'w-8 h-8 shrink-0 flex items-center justify-center rounded bg-dark-700 hover:bg-dark-600 text-gray-200 disabled:opacity-30';

  return (
    <div className="space-y-4">
      {sections.length > 0 && (
        <>
          <Timeline sections={sections} names={names} />
          <Summary sections={sections} bpm={bpm} />
        </>
      )}

      <div className="space-y-2">
        {sections.map((s, i) => (
          <div key={s.id} className="bg-dark-800 border border-dark-700 rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className={`${colorFor(s)} w-1.5 self-stretch rounded shrink-0`} />
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={`${smallButton} h-6`} aria-label="Move up">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} className={`${smallButton} h-6`} aria-label="Move down">▼</button>
              </div>
              <span className="font-semibold flex-1 min-w-0 truncate">{names[i]}</span>
              <button type="button" onClick={() => patch(i, { bars: Math.max(1, s.bars - 1) })} className={smallButton} aria-label="Fewer bars">−</button>
              <span className="w-12 shrink-0 text-center text-xs text-gray-300">{s.bars} bars</span>
              <button type="button" onClick={() => patch(i, { bars: s.bars + 1 })} className={smallButton} aria-label="More bars">+</button>
              <button type="button" onClick={() => remove(i)} className={`${smallButton} text-red-400`} aria-label="Remove section">✕</button>
            </div>
            <input
              type="text"
              value={s.chords}
              onChange={(e) => setChords(i, e.target.value)}
              placeholder="Chords, e.g. Am F C G"
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 font-mono text-sm"
            />
            {kindCounts[kindOf(s)] > 1 && (
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={s.linked}
                  onChange={() => toggleLinked(i)}
                  className="accent-brand-600"
                />
                Same chords as every {kindOf(s)}
              </label>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">Add section</p>
        <div className="flex flex-wrap gap-2">
          {SECTION_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => addSection(t.type)}
              className="px-3 py-2 rounded bg-dark-700 hover:bg-dark-600 text-sm font-semibold flex items-center gap-2"
            >
              <span className={`${t.color} w-2.5 h-2.5 rounded-full`} />+ {t.type}
            </button>
          ))}
          {customKinds.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addSection('Other', name)}
              className="px-3 py-2 rounded bg-dark-700 hover:bg-dark-600 text-sm font-semibold flex items-center gap-2"
            >
              <span className={`${OTHER_COLOR} w-2.5 h-2.5 rounded-full`} />+ {name}
            </button>
          ))}
          {customName === null && (
            <button
              type="button"
              onClick={() => setCustomName('')}
              className="px-3 py-2 rounded border border-dashed border-dark-600 hover:bg-dark-700 text-sm font-semibold text-gray-300"
            >
              + Custom…
            </button>
          )}
        </div>
        {customName !== null && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
                if (e.key === 'Escape') setCustomName(null);
              }}
              placeholder="Section name, e.g. Interlude"
              autoFocus
              className="flex-1 min-w-0 bg-dark-900 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
            />
            <button
              type="button"
              onClick={addCustom}
              disabled={!customName.trim()}
              className="px-3 py-2 bg-brand-600 hover:bg-brand-700 rounded text-sm font-semibold disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setCustomName(null)}
              className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
