import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { songsAPI } from '../api';
import { useStore } from '../store';

export default function SongsList() {
  const { songs, setSongs } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const data = await songsAPI.getAll();
      setSongs(data);
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = songs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Band photo banner */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        <img
          src="/band-photo.jpg"
          alt="Casiopony"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />
        <button
          onClick={() => useStore.getState().logout()}
          className="absolute right-4 px-3 py-2 text-sm bg-black/50 hover:bg-black/70 backdrop-blur rounded"
          style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
        >
          Logout
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
          <img
            src="/casiopony-logo.png"
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded object-contain shadow-lg"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Casiopony</h1>
            <p className="text-gray-300 text-sm">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-dark-900/95 backdrop-blur border-b border-dark-700 p-4 sticky top-0 z-10">
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Create Song Button */}
      <div className="p-4">
        <Link
          to="/songs/new"
          className="block w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-center shadow-lg shadow-brand-900/40"
        >
          + New Song
        </Link>
      </div>

      {/* Songs List */}
      <div className="px-4 pb-20">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading songs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {songs.length === 0 ? 'No songs yet. Create one!' : 'No matches found.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((song) => (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                className="block p-4 bg-dark-800 border border-dark-700 rounded hover:bg-dark-700 transition"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                  {song.updated_at && (
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(song.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {song.key && <Tag label="Key" value={song.key} />}
                  {song.bpm && <Tag label="BPM" value={song.bpm} />}
                  {song.capo !== null && song.capo !== undefined && <Tag label="Capo" value={song.capo} />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full bg-dark-700 text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-100">{value}</span>
    </span>
  );
}
