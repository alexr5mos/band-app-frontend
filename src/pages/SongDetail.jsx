import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { songsAPI } from '../api';
import { useStore } from '../store';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSong, setCurrentSong } = useStore();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!id);
  const [saving, setSaving] = useState(false);

  const [song, setSong] = useState(
    currentSong || {
      title: '',
      genre: '',
      bpm: '',
      key: '',
      details: { lyrics: '', chords: '', structure: '', notes: '' },
    }
  );

  useEffect(() => {
    if (id && !currentSong) {
      loadSong();
    }
  }, [id, currentSong]);

  const loadSong = async () => {
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
    setSaving(true);
    try {
      if (!id) {
        // Creating new song
        const data = await songsAPI.create({
          title: song.title,
          genre: song.genre,
          bpm: song.bpm,
          key: song.key,
        });
        if (song.details) {
          await songsAPI.updateDetails(data.id, song.details);
        }
        setCurrentSong(null);
        navigate(`/songs/${data.id}`);
      } else {
        // Updating existing song
        await songsAPI.update(song.id, {
          title: song.title,
          genre: song.genre,
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
    } finally {
      setSaving(false);
    }
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
          className="text-blue-400 hover:text-blue-300 font-semibold"
        >
          ← Songs
        </button>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Save'}
            </button>
            <button
              onClick={() => navigate('/songs')}
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
          >
            Edit
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Title */}
        {editing ? (
          <input
            type="text"
            value={song.title}
            onChange={(e) => setSong({ ...song, title: e.target.value })}
            placeholder="Song title"
            className="w-full text-3xl font-bold bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        ) : (
          <h1 className="text-3xl font-bold">{song.title}</h1>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          {editing ? (
            <>
              <input
                type="text"
                placeholder="Genre"
                value={song.genre || ''}
                onChange={(e) => setSong({ ...song, genre: e.target.value })}
                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="BPM"
                value={song.bpm || ''}
                onChange={(e) => setSong({ ...song, bpm: e.target.value })}
                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Key"
                value={song.key || ''}
                onChange={(e) => setSong({ ...song, key: e.target.value })}
                className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </>
          ) : (
            <>
              {song.genre && <div>📻 <strong>Genre:</strong> {song.genre}</div>}
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
              className="w-full h-32 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
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
              className="w-full h-40 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
            <textarea
              value={song.details?.structure || ''}
              onChange={(e) => setSong({
                ...song,
                details: { ...song.details, structure: e.target.value },
              })}
              placeholder="Verse • Chorus • Bridge • Chorus • Outro"
              className="w-full h-20 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded p-3 whitespace-pre-wrap">
              {song.details?.structure || 'No structure yet'}
            </div>
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
              className="w-full h-24 bg-dark-800 border border-dark-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <div className="bg-dark-800 border border-dark-700 rounded p-3 whitespace-pre-wrap">
              {song.details?.notes || 'No notes yet'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
