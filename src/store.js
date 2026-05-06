import { create } from 'zustand';

export const useStore = create((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  songs: [],
  currentSong: null,

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, songs: [] });
  },

  setSongs: (songs) => set({ songs }),
  
  setCurrentSong: (song) => set({ currentSong: song }),

  addSong: (song) => set((state) => ({
    songs: [song, ...state.songs]
  })),

  updateSong: (id, updates) => set((state) => ({
    songs: state.songs.map(s => s.id === id ? { ...s, ...updates } : s)
  }))
}));
