import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SongsList from './pages/SongsList';
import SongDetail from './pages/SongDetail';

function App() {
  const { token } = useStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {token ? (
          <>
            <Route path="/songs" element={<SongsList />} />
            <Route path="/songs/new" element={<SongDetail />} />
            <Route path="/songs/:id" element={<SongDetail />} />
            <Route path="/" element={<Navigate to="/songs" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
