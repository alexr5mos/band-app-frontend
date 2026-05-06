import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useStore } from '../store';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.login(form.email, form.password);
      setUser(data.user);
      setToken(data.token);
      navigate('/songs');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/band-photo.jpg" 
            alt="Casiopony" 
            className="w-40 h-40 rounded-lg object-cover mx-auto mb-6 border-2 border-dark-700 shadow-lg"
          />
          <h2 className="text-4xl font-bold text-white mb-1">Casiopony</h2>
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
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
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

        <p className="text-center text-gray-400 mt-6">
          New?{' '}
          <Link to="/signup" className="text-red-500 hover:text-red-400 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
