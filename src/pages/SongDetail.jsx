import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { songsAPI } from '../api';
import { useStore } from '../store';
import RecordingsPanel from './RecordingsPanel';
import { SongStructureEditor, SongStructureView, songLength } from './SongStructure';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentSong } = useStore();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [textSize, setTextSize] = useTextSize();

  const [song, setSong] = useState({
    title: '',
    capo: null,
    bpm: '',
    key: '',
    details: { lyrics: '', chords: '', structure: '', notes: '' },
  });

  useEffect(() => {
    if (id) {
      setCurrentSong(null);
      loadSong();
    }
  }, [id]);

  const loadSong = async () => {
    setLoading(true);
    try {
      const data = await songsAPI.getOne(id);
      setSong(data);
      setCurrentSong(data);
    } catch (err) {
      console.error('Failed to load song:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!song.title.trim()) {
      setError('Give the song a title before saving.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (!id) {
        const data = await songsAPI.create({
          title: song.title,
          capo: song.capo,
          bpm: song.bpm,
          key: song.key,
        });
        if (song.details) {
          await songsAPI.updateDetails(data.id, song.details);
        }
        setCurrentSong(null);
        navigate(`/songs/${data.id}`);
      } else {
        await songsAPI.update(song.id, {
          title: song.title,
          capo: song.capo,
          bpm: song.bpm,
          key: song.key,
        });
        if (song.details) {
          await songsAPI.updateDetails(song.id, song.details);
        }
        setEditing(false);
        setCurrentSong(null);
        loadSong();
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setError(`Couldn't save the song: ${err.message || 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setError('');
    if (!id) {
      navigate('/songs');
      return;
    }
    // Throw away unsaved edits and go back to viewing the song.
    setEditing(false);
    loadSong();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await songsAPI.delete(song.id);
      setCurrentSong(null);
      navigate('/songs');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-dark-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const inputClass = 'bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500';
  const setDetail = (field, value) => setSong((prev) => ({
    ...prev,
    details: { ...prev.details, [field]: value },
  }));

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-20">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 p-4 flex justify-between items-center sticky top-0 z-10">
        <button
          onClick={() => navigate('/songs')}
          className="text-brand-400 hover:text-brand-300 font-semibold"
        >
          ← Songs
        </button>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-semibold"
            >
              Cancel
            </button>
            {id && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-900 hover:bg-red-800 rounded text-sm font-semibold"
              >
                🗑️
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TextSizeToggle size={textSize} onChange={setTextSize} />
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded text-sm font-semibold"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-200 rounded p-3 text-sm">
            {error}
          </div>
        )}

        {editing ? (
          <>
            <input
              type="text"
              value={song.title}
              onChange={(e) => setSong({ ...song, title: e.target.value })}
              placeholder="Song title"
              className={`w-full text-3xl font-bold ${inputClass}`}
            />

            <div className="grid grid-cols-3 gap-2">
              <label className="min-w-0 text-xs text-gray-400">
                Key
                <input
                  type="text"
                  placeholder="e.g. Am"
                  value={song.key || ''}
                  onChange={(e) => setSong({ ...song, key: e.target.value })}
                  className={`mt-1 w-full text-base ${inputClass}`}
                />
              </label>
              <label className="min-w-0 text-xs text-gray-400">
                BPM
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={song.bpm || ''}
                  onChange={(e) => setSong({ ...song, bpm: e.target.value })}
                  className={`mt-1 w-full text-base ${inputClass}`}
                />
              </label>
              <label className="min-w-0 text-xs text-gray-400">
                Capo
                <select
                  value={song.capo || ''}
                  onChange={(e) => setSong({ ...song, capo: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className={`mt-1 w-full text-base ${inputClass}`}
                >
                  <option value="">No capo</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((fret) => (
                    <option key={fret} value={fret}>
                      Fret {fret}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Section title="Structure & chords">
              <SongStructureEditor
                raw={song.details?.structure || ''}
                bpm={song.bpm}
                onChange={(structure) => setDetail('structure', structure)}
              />
            </Section>

            <Section title="Lyrics">
              <textarea
                value={song.details?.lyrics || ''}
                onChange={(e) => setDetail('lyrics', e.target.value)}
                placeholder="Song lyrics..."
                className={`w-full h-64 ${inputClass}`}
              />
            </Section>

            <Section title="Other chords">
              <textarea
                value={song.details?.chords || ''}
                onChange={(e) => setDetail('chords', e.target.value)}
                placeholder="Riffs, voicings, anything that doesn't fit a section..."
                className={`w-full h-24 font-mono text-sm ${inputClass}`}
              />
            </Section>

            <Section title="Notes">
              <textarea
                value={song.details?.notes || ''}
                onChange={(e) => setDetail('notes', e.target.value)}
                placeholder="Rehearsal notes..."
                className={`w-full h-24 ${inputClass}`}
              />
            </Section>
          </>
        ) : (
          <SongView song={song} songId={id} textSize={textSize} />
        )}
      </div>
    </div>
  );
}

// Lyrics and chords text sizes for reading from a music stand or a phone on the floor.
const TEXT_SIZES = {
  normal: { lyrics: 'text-base leading-relaxed', chords: 'text-sm' },
  large: { lyrics: 'text-xl leading-relaxed', chords: 'text-lg' },
};

function useTextSize() {
  const [size, setSize] = useState(() => {
    try {
      return localStorage.getItem('songTextSize') === 'large' ? 'large' : 'normal';
    } catch {
      return 'normal';
    }
  });
  const update = (next) => {
    setSize(next);
    try {
      localStorage.setItem('songTextSize', next);
    } catch {
      // Private browsing: the choice just isn't remembered.
    }
  };
  return [size, update];
}

function TextSizeToggle({ size, onChange }) {
  const large = size === 'large';
  return (
    <button
      onClick={() => onChange(large ? 'normal' : 'large')}
      aria-label={large ? 'Smaller text' : 'Larger text'}
      aria-pressed={large}
      className={`px-3 py-2 rounded text-sm font-semibold ${large ? 'bg-dark-600 text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
    >
      <span className="text-xs">A</span><span className="text-base">A</span>
    </button>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Chip({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-full bg-dark-800 border border-dark-700 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

// Read-only song page, laid out for rehearsal: the essentials up top, then
// structure and chords, then lyrics. Empty sections are left out.
function SongView({ song, songId, textSize }) {
  const details = song.details || {};
  const sizes = TEXT_SIZES[textSize];
  const length = songLength(details.structure, song.bpm);
  const hasStructure = Boolean(details.structure?.trim());
  const sections = [
    hasStructure && { id: 'structure', label: 'Structure' },
    details.lyrics?.trim() && { id: 'lyrics', label: 'Lyrics' },
    details.chords?.trim() && { id: 'chords', label: 'Chords' },
    details.notes?.trim() && { id: 'notes', label: 'Notes' },
    songId && { id: 'recordings', label: 'Recordings' },
  ].filter(Boolean);
  const missing = [
    !hasStructure && 'structure',
    !details.lyrics?.trim() && 'lyrics',
    !details.notes?.trim() && 'notes',
  ].filter(Boolean);

  return (
    <>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold leading-tight">{song.title}</h1>
        <div className="flex flex-wrap gap-2">
          {song.key && <Chip label="Key" value={song.key} />}
          {song.bpm && <Chip label="BPM" value={song.bpm} />}
          {song.capo !== null && song.capo !== undefined && <Chip label="Capo" value={song.capo} />}
          {length && <Chip label="Length" value={length} />}
        </div>
      </div>

      {sections.length > 2 && (
        <nav className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-dark-700 hover:bg-dark-600 text-sm font-semibold text-gray-200"
            >
              {s.label}
            </a>
          ))}
        </nav>
      )}

      {hasStructure && (
        <Section id="structure" title="Structure & chords">
          <SongStructureView raw={details.structure} bpm={song.bpm} chordSize={sizes.chords} />
        </Section>
      )}

      {details.lyrics?.trim() && (
        <Section id="lyrics" title="Lyrics">
          <div className={`whitespace-pre-wrap ${sizes.lyrics}`}>{details.lyrics}</div>
        </Section>
      )}

      {details.chords?.trim() && (
        <Section id="chords" title={hasStructure ? 'Other chords' : 'Chords'}>
          <div className={`bg-dark-800 border border-dark-700 rounded p-3 font-mono whitespace-pre-wrap ${sizes.chords}`}>
            {details.chords}
          </div>
        </Section>
      )}

      {details.notes?.trim() && (
        <Section id="notes" title="Notes">
          <div className="bg-amber-950/30 border border-amber-900/50 rounded p-3 whitespace-pre-wrap">
            {details.notes}
          </div>
        </Section>
      )}

      {missing.length > 0 && (
        <p className="text-sm text-gray-500">
          No {missing.join(', ').replace(/, ([^,]*)$/, ' or $1')} yet. Tap Edit to add them.
        </p>
      )}

      {songId && (
        <div id="recordings" className="scroll-mt-20">
          <RecordingsPanel songId={songId} />
        </div>
      )}
    </>
  );
}
