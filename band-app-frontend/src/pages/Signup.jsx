import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useStore } from '../store';

export default function Signup() {
  const navigate = useNavigate();
  const { setUser, setToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    instrument: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.signup(
        form.email,
        form.password,
        form.username,
        form.instrument
      );
      setUser(data.user);
      setToken(data.token);
      navigate('/songs');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎸</h1>
          <h2 className="text-2xl font-bold text-white">Join the Band</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Your name"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />

          <select
            value={form.instrument}
            onChange={(e) => setForm({ ...form, instrument: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select instrument</option>
            <option value="vocals">Vocals</option>
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
            <option value="drums">Drums</option>
            <option value="keys">Keys</option>
            <option value="other">Other</option>
          </select>

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
