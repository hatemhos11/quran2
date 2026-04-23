import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export function pinnedAyahKey(surah: number, numberInSurah: number): string {
  return `${surah}:${numberInSurah}`;
}

interface PinnedAyahState {
  pins: Record<string, true>;
  isPinned: (surah: number, numberInSurah: number) => boolean;
  togglePin: (surah: number, numberInSurah: number) => void;
}

export const usePinnedAyahStore = create<PinnedAyahState>()(
  persist(
    (set, get) => ({
      pins: {},
      isPinned: (surah, numberInSurah) =>
        !!get().pins[pinnedAyahKey(surah, numberInSurah)],
      togglePin: (surah, numberInSurah) => {
        const k = pinnedAyahKey(surah, numberInSurah);
        set((s) => {
          const next = { ...s.pins };
          if (next[k]) delete next[k];
          else next[k] = true;
          return { pins: next };
        });
      },
    }),
    {
      name: 'quran-pinned-ayahs-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
