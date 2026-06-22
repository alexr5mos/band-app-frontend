import { supabase } from './lib/supabase';

function toIntOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export const songsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getOne: async (id) => {
    const { data: song, error: e1 } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();
    if (e1) throw e1;

    const { data: details, error: e2 } = await supabase
      .from('song_details')
      .select('*')
      .eq('song_id', id)
      .maybeSingle();
    if (e2) throw e2;

    return {
      ...song,
      details: details || { lyrics: '', chords: '', structure: '', notes: '' },
      audioFiles: [],
    };
  },

  create: async (data) => {
    const { data: song, error } = await supabase
      .from('songs')
      .insert({
        title: data.title,
        capo: toIntOrNull(data.capo),
        bpm: toIntOrNull(data.bpm),
        key: data.key || null,
      })
      .select()
      .single();
    if (error) throw error;
    return song;
  },

  update: async (id, data) => {
    const { error } = await supabase
      .from('songs')
      .update({
        title: data.title,
        capo: toIntOrNull(data.capo),
        bpm: toIntOrNull(data.bpm),
        key: data.key || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  updateDetails: async (songId, details) => {
    const payload = {
      lyrics: details.lyrics || '',
      chords: details.chords || '',
      structure: details.structure || '',
      notes: details.notes || '',
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: e0 } = await supabase
      .from('song_details')
      .select('id')
      .eq('song_id', songId)
      .maybeSingle();
    if (e0) throw e0;

    if (existing) {
      const { error } = await supabase
        .from('song_details')
        .update(payload)
        .eq('song_id', songId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('song_details')
        .insert({ song_id: songId, ...payload });
      if (error) throw error;
    }
  },

  delete: async (id) => {
    await supabase.from('song_details').delete().eq('song_id', id);
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) throw error;
  },
};
