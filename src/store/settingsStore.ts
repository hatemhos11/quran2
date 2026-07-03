import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ReadingFontId, ThemeMode, TafsirEdition } from '@/types';
import { DEFAULT_RECITER_ID, FONT_SIZE_MAX, FONT_SIZE_MIN } from '@/utils/constants';

export interface SettingsState {
  fontSize: number;
  theme: ThemeMode;
  preferredTafsir: TafsirEdition;
  showTransliteration: boolean;
  readingFont: ReadingFontId;
  preferredReciter: string;
  setFontSize: (size: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setPreferredTafsir: (t: TafsirEdition) => void;
  setShowTransliteration: (v: boolean) => void;
  setReadingFont: (f: ReadingFontId) => void;
  setPreferredReciter: (id: string) => void;
}

const clampFont = (n: number) => Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 32,
      theme: 'light',
      preferredTafsir: 'ar.muyassar',
      showTransliteration: true,
      readingFont: 'amiri',
      preferredReciter: DEFAULT_RECITER_ID,
      setFontSize: (size) => set({ fontSize: clampFont(size) }),
      setTheme: (theme) => set({ theme }),
      setPreferredTafsir: (preferredTafsir) => set({ preferredTafsir }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setReadingFont: (readingFont) => set({ readingFont }),
      setPreferredReciter: (preferredReciter) => set({ preferredReciter }),
    }),
    {
      name: 'quran-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
