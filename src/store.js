import { create } from 'zustand';
import { supabase } from './lib/supabase';

export const useStore = create((set) => ({
  session: null,
  songs: [],
  currentSong: null,

  setSession: (session) => set({ session }),
  setSongs: (songs) => set({ songs }),
  setCurrentSong: (song) => set({ currentSong: song }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, songs: [], currentSong: null });
  },
}));
