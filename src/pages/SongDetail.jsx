import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { songsAPI, uploadAPI } from '../api';
import { useStore } from '../store';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSong, setCurrentSong } = useStore();
  const [loading, setLoading] = useState(!id);
  const [editing, setEditing] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [song, setSong] = useState(
    currentSong || {
      title: '',
      genre: '',
      bpm: '',
      key: '',
      details: { lyrics: '', chords: '', structure: '', notes: '' },
      audioFiles: []
    }
  );

  useEffect(() => {
    if (id && !currentSong) {
      loadSong();
    }
  }, [id, currentSong]);

  const loadSong = async () => {
    try {
      const { data } = await songsAPI.getOne(id);
      setSong(data);
      setCurrentSong(data);
    } catch (err) {
      console.error('Failed to load song:', err);
    } finally {
      setLoading(false);
    }
  };

  cconst handleSave = async () => {
  setSaving(true);
  try {
    if (!id) {
      // Creating new song
      const { data } = await songsAPI.create({
        title: song.title,
        genre: song.genre,
        bpm: song.bpm,
        key: song.key
      });
      // Save details
      if (song.details) {
        await songsAPI.updateDetails(data.id, song.details);
      }
      navigate(`/songs/${data.id}`);
    } else {
      // Updating existing song
      await songsAPI.update(song.id, {
        title: song.title,
        genre: song.genre,
        bpm: song.bpm,
        key: song.key
      });
      if (song.details) {
        await songsAPI.updateDetails(song.id, song.details);
      }
      setEditing(false);
      loadSong();
    }
  } catch (err) {
    console.error('Failed to save:', err);
  } finally {
    setSaving(false);
  }
};

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadAPI.audio(song.id, file);
      loadSong();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this song?')) return;
    try {
      await songsAPI.delete(song.id);
      navigate('/songs');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return <div className="h-screen bg-dark-900 flex items-center justify-center text-white">Loading...</div>;
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
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
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
                details: { ...song.details, chords: e.target.value }
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
                details: { ...song.details, lyrics: e.target.value }
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
                details: { ...song.details, structure: e.target.value }
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

        {/* Audio Files */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Recordings</h2>
          {song.audioFiles?.length > 0 ? (
            <div className="space-y-2">
              {song.audioFiles.map(audio => (
                <div key={audio.id} className="bg-dark-800 border border-dark-700 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">🔊 {audio.file_name}</p>
                      <p className="text-sm text-gray-400">v{audio.version_number} • {new Date(audio.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <audio controls className="h-8 text-xs" style={{ minWidth: '150px' }}>
                      <source src={audio.file_path} />
                    </audio>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">No recordings yet</div>
          )}

          <label className="block mt-4 px-4 py-3 bg-dark-800 border border-dark-700 rounded cursor-pointer hover:bg-dark-700 text-center font-semibold">
            {uploading ? 'Uploading...' : '⬆️ Upload Audio'}
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Save/Delete Buttons */}
        {editing && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : '✓ Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-3 bg-red-900 hover:bg-red-800 rounded font-semibold"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
