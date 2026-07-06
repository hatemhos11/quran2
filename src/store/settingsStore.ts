import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AyahLayoutMode, ThemeMode, TafsirEdition } from '@/types';
import { DEFAULT_RECITER_ID, FONT_SIZE_MAX, FONT_SIZE_MIN } from '@/utils/constants';

export interface SettingsState {
  fontSize: number;
  theme: ThemeMode;
  preferredTafsir: TafsirEdition;
  showTransliteration: boolean;
  preferredReciter: string;
  ayahLayout: AyahLayoutMode;
  setFontSize: (size: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setPreferredTafsir: (t: TafsirEdition) => void;
  setShowTransliteration: (v: boolean) => void;
  setPreferredReciter: (id: string) => void;
  setAyahLayout: (layout: AyahLayoutMode) => void;
}

const clampFont = (n: number) => Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 32,
      theme: 'light',
      preferredTafsir: 'ar.muyassar',
      showTransliteration: true,
      preferredReciter: DEFAULT_RECITER_ID,
      ayahLayout: 'cards',
      setFontSize: (size) => set({ fontSize: clampFont(size) }),
      setTheme: (theme) => set({ theme }),
      setPreferredTafsir: (preferredTafsir) => set({ preferredTafsir }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setPreferredReciter: (preferredReciter) => set({ preferredReciter }),
      setAyahLayout: (ayahLayout) => set({ ayahLayout }),
    }),
    {
      name: 'quran-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
