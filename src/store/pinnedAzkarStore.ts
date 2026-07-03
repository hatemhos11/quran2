import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AzkarCategory } from '@/types';

interface PinnedAzkarState {
  pinnedCategories: string[];
  isPinned: (name: string) => boolean;
  togglePin: (name: string) => void;
}

export function sortAzkarCategories(
  categories: AzkarCategory[],
  pinnedOrder: string[]
): AzkarCategory[] {
  if (pinnedOrder.length === 0) return categories;

  const pinnedSet = new Set(pinnedOrder);
  const byName = new Map(categories.map((c) => [c.name, c]));
  const pinned: AzkarCategory[] = [];

  for (const name of pinnedOrder) {
    const cat = byName.get(name);
    if (cat) pinned.push(cat);
  }

  const unpinned = categories.filter((c) => !pinnedSet.has(c.name));
  return [...pinned, ...unpinned];
}

export const usePinnedAzkarStore = create<PinnedAzkarState>()(
  persist(
    (set, get) => ({
      pinnedCategories: [],
      isPinned: (name) => get().pinnedCategories.includes(name),
      togglePin: (name) =>
        set((s) => {
          const idx = s.pinnedCategories.indexOf(name);
          if (idx >= 0) {
            return {
              pinnedCategories: s.pinnedCategories.filter((n) => n !== name),
            };
          }
          return { pinnedCategories: [name, ...s.pinnedCategories] };
        }),
    }),
    {
      name: 'quran-pinned-azkar-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
