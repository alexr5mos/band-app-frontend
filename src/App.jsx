import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useStore } from './store';
import Login from './pages/Login';
import SongsList from './pages/SongsList';
import SongDetail from './pages/SongDetail';

function App() {
  const { session, setSession } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/songs" /> : <Login />}
        />

        {session ? (
          <>
            <Route path="/songs" element={<SongsList />} />
            <Route path="/songs/new" element={<SongDetail />} />
            <Route path="/songs/:id" element={<SongDetail />} />
            <Route path="*" element={<Navigate to="/songs" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
