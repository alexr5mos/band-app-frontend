// components/RecordingsPanel.jsx
// Recordings section for the song detail page.
// Handles: upload with progress bar, optional label, playback, delete.

import { useState, useRef, useEffect } from 'react';
import api from '../lib/api'; // your existing axios/fetch wrapper

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Math.round(audio.duration)); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    audio.src = url;
  });
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// AudioPlayer — loads a signed URL on demand then plays inline
// ---------------------------------------------------------------------------
function AudioPlayer({ recordingId }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    if (url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/recordings/${recordingId}/url`);
      setUrl(res.data.url);
    } catch {
      setError('Could not load audio');
    } finally {
      setLoading(false);
    }
  }

  if (error) return <span className="text-xs text-red-500">{error}</span>;

  if (!url) {
    return (
      <button
        onClick={load}
        disabled={loading}
        className="text-sm text-red-600 font-medium hover:underline disabled:opacity-50"
      >
        {loading ? 'Loading…' : '▶ Play'}
      </button>
    );
  }

  return (
    <audio
      controls
      autoPlay
      src={url}
      className="w-full h-8 mt-1"
      style={{ accentColor: '#dc2626' }}
    />
  );
}

// ---------------------------------------------------------------------------
// RecordingRow — one recording entry
// ---------------------------------------------------------------------------
function RecordingRow({ recording, onDeleted }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/recordings/${recording.id}`);
      onDeleted(recording.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <span className="font-medium text-sm text-gray-900 block truncate">
            {recording.label || recording.filename}
          </span>
          {recording.label && (
            <span className="text-xs text-gray-400 truncate block">{recording.filename}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0 mt-0.5">
          {recording.duration_seconds && <span>{formatDuration(recording.duration_seconds)}</span>}
          {recording.file_size_bytes && <span>{formatBytes(recording.file_size_bytes)}</span>}
          <span>{new Date(recording.created_at).toLocaleDateString()}</span>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              title="Delete recording"
            >
              ✕
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 font-medium hover:underline disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete?'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-gray-400 hover:underline">
                Cancel
              </button>
            </span>
          )}
        </div>
      </div>
      <AudioPlayer recordingId={recording.id} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// UploadForm
// ---------------------------------------------------------------------------
function UploadForm({ songId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setStatus('idle');
    setProgress(0);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setError(null);

    try {
      // Detect duration before upload
      const duration_seconds = await getAudioDuration(file);

      // Build multipart form data
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('song_id', songId);
      if (label.trim()) formData.append('label', label.trim());
      if (duration_seconds) formData.append('duration_seconds', duration_seconds);

      // Upload via your backend using XMLHttpRequest so we can show progress
      const token = localStorage.getItem('token'); // adjust if you store JWT differently
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${import.meta.env.VITE_API_URL}/recordings/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      setStatus('done');
      setFile(null);
      setLabel('');
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded(result);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed');
      setStatus('error');
    }
  }

  const isUploading = status === 'uploading';

  return (
    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-3">Add a recording</p>

      <div className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                     file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700
                     hover:file:bg-red-100 disabled:opacity-50"
        />

        {file && (
          <>
            <input
              type="text"
              placeholder="Label (optional) — e.g. full band, guitar idea"
              value={label}
              onChange={e => setLabel(e.target.value)}
              disabled={isUploading}
              className="text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium
                           hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading…' : 'Upload'}
              </button>
              {!isUploading && (
                <span className="text-xs text-gray-400">
                  {file.name} · {formatBytes(file.size)}
                </span>
              )}
            </div>
          </>
        )}

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {status === 'done' && (
          <p className="text-sm text-green-600 font-medium">✓ Uploaded</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecordingsPanel — main export, add to your song detail page
// ---------------------------------------------------------------------------
export default function RecordingsPanel({ songId }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/recordings?song_id=${songId}`)
      .then(res => setRecordings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [songId]);

  function handleUploaded(newRecording) {
    setRecordings(prev => [newRecording, ...prev]);
  }

  function handleDeleted(id) {
    setRecordings(prev => prev.filter(r => r.id !== id));
  }

  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Recordings</h2>
      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading…' : recordings.length === 0
          ? 'No recordings yet.'
          : `${recordings.length} take${recordings.length !== 1 ? 's' : ''}`}
      </p>

      {recordings.map(r => (
        <RecordingRow key={r.id} recording={r} onDeleted={handleDeleted} />
      ))}

      <UploadForm songId={songId} onUploaded={handleUploaded} />
    </section>
  );
}
