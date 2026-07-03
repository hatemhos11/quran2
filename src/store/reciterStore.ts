import { create } from 'zustand';

import { fetchAudioReciters } from '@/services/quranAudioApi';
import type { AudioReciter } from '@/types';

interface ReciterState {
  reciters: AudioReciter[];
  loading: boolean;
  error: string | null;
  loadReciters: (force?: boolean) => Promise<void>;
}

export const useReciterStore = create<ReciterState>((set, get) => ({
  reciters: [],
  loading: false,
  error: null,
  loadReciters: async (force = false) => {
    if (get().loading) return;
    if (!force && get().reciters.length > 0) return;
    set({ loading: true, error: null });
    try {
      const reciters = await fetchAudioReciters();
      reciters.sort((a, b) => {
        if (a.language === b.language) return a.name.localeCompare(b.name, 'ar');
        if (a.language === 'ar') return -1;
        if (b.language === 'ar') return 1;
        return a.name.localeCompare(b.name, 'ar');
      });
      set({ reciters, loading: false });
    } catch {
      set({ loading: false, error: 'load_failed' });
    }
  },
}));
