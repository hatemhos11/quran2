import { create } from 'zustand';

import { loadAllSurahs } from '@/services/offlineStorage';
import { ar } from '@/i18n/ar';
import type { SurahMeta } from '@/types';

export interface QuranState {
  surahs: SurahMeta[];
  currentSurahNumber: number;
  isOffline: boolean;
  surahsLoading: boolean;
  surahsError: string | null;
  loadSurahs: () => Promise<void>;
  setCurrentSurahNumber: (n: number) => void;
  setOffline: (v: boolean) => void;
}

export const useQuranStore = create<QuranState>((set) => ({
  surahs: [],
  currentSurahNumber: 1,
  isOffline: false,
  surahsLoading: false,
  surahsError: null,

  setOffline: (isOffline) => set({ isOffline }),

  setCurrentSurahNumber: (currentSurahNumber) => set({ currentSurahNumber }),

  loadSurahs: async () => {
    set({ surahsLoading: true, surahsError: null });
    try {
      const list = await loadAllSurahs();
      set({ surahs: list, surahsLoading: false });
    } catch {
      set({
        surahs: [],
        surahsLoading: false,
        surahsError: ar.couldNotLoadSurahs,
      });
    }
  },
}));
