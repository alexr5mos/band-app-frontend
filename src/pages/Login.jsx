import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      setError('Wrong email or password');
      setLoading(false);
    } else {
      navigate('/songs');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/casiopony-logo.png"
            alt="Casiopony"
            className="w-48 h-48 rounded-lg object-contain mx-auto mb-6 border-2 border-dark-700 shadow-lg"
          />
          <p className="text-gray-400 mt-2">Your band's creative space</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Band email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Band password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
