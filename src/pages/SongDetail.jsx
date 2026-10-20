import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { songsAPI } from '../api';
import { useStore } from '../store';
import RecordingsPanel from './RecordingsPanel';
import { SongStructureEditor, SongStructureView } from './SongStructure';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentSong } = useStore();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded text-sm font-semibold"
          >
            Edit
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-200 rounded p-3 text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        {editing ? (
          <input
            type="text"
            value={song.title}
            onChange={(e) => setSong({ ...song, title: e.target.value })}
            placeholder="Song title"
            className="w-full text-3xl font-bold bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white focus:outline-none focus:border-brand-500"
          />
        ) : (
          <h1 className="text-3xl font-bold">{song.title}</h1>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          {editing ? (
            <>
              <select
                value={song.capo || ''}
                onChange={(e) => setSong({ ...song, capo: e.target.value ? parseInt(e.target.value, 10) : null })}
                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">No capo</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((fret) => (
                  <option key={fret} value={fret}>
                    Capo {fret}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="BPM"
                value={song.bpm || ''}
                onChange={(e) => setSong({ ...song, bpm: e.target.value })}
                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <input
                type="text"
                placeholder="Key"
                value={song.key || ''}
                onChange={(e) => setSong({ ...song, key: e.target.value })}
                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </>
          ) : (
            <>
              {song.capo !== null && song.capo !== undefined && <div>🪜 <strong>Capo:</strong> Fret {song.capo}</div>}
              {song.bpm && <div>🎵 <strong>BPM:</strong> {song.bpm}</div>}
              {song.key && <div>🎼 <strong>Key:</strong> {song.key}</div>}
            </>
          )}
        </div>

        {/* Chords */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Chords</h2>
          {editing ? (
            <textarea
              value={song.details?.chords || ''}
              onChange={(e) => setSong({
                ...song,
                details: { ...song.details, chords: e.target.value },
              })}
              placeholder="Verse: Am, F, C, G..."
              className="w-full h-32 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 font-mono text-sm"
            />
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded p-3 font-mono text-sm whitespace-pre-wrap">
              {song.details?.chords || 'No chords yet'}
            </div>
          )}
        </div>

        {/* Lyrics */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Lyrics</h2>
          {editing ? (
            <textarea
              value={song.details?.lyrics || ''}
              onChange={(e) => setSong({
                ...song,
                details: { ...song.details, lyrics: e.target.value },
              })}
              placeholder="Song lyrics..."
              className="w-full h-40 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded p-3 whitespace-pre-wrap">
              {song.details?.lyrics || 'No lyrics yet'}
            </div>
          )}
        </div>

        {/* Structure */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Structure</h2>
          {editing ? (
            <SongStructureEditor
              raw={song.details?.structure || ''}
              bpm={song.bpm}
              onChange={(structure) => setSong((prev) => ({
                ...prev,
                details: { ...prev.details, structure },
              }))}
            />
          ) : (
            <SongStructureView raw={song.details?.structure || ''} bpm={song.bpm} />
          )}
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Notes</h2>
          {editing ? (
            <textarea
              value={song.details?.notes || ''}
              onChange={(e) => setSong({
                ...song,
                details: { ...song.details, notes: e.target.value },
              })}
              placeholder="Rehearsal notes..."
              className="w-full h-24 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded p-3 whitespace-pre-wrap">
              {song.details?.notes || 'No notes yet'}
            </div>
          )}
        </div>

        {/* Recordings — only shown when viewing, not editing */}
        {id && !editing && <RecordingsPanel songId={id} />}
      </div>
    </div>
  );
}
