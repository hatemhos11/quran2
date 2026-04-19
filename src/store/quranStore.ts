import { create } from 'zustand';

import { apiFetchAllSurahs, apiFetchSurahWithAyahs, apiFetchTafsir } from '@/services/quranApi';
import {
  deleteSurahDownload,
  listDownloadedSurahNumbers,
  saveFullSurahDownload,
} from '@/services/offlineStorage';
import { ar } from '@/i18n/ar';
import type { SurahMeta, TafsirEdition } from '@/types';
import { SURAH_COUNT, TAFSIR_SOURCES } from '@/utils/constants';

/** Thrown when the user aborts a bulk download (no partial surah is saved). */
export class BulkDownloadCancelledError extends Error {
  constructor() {
    super('BulkDownloadCancelled');
    this.name = 'BulkDownloadCancelledError';
  }
}

export interface QuranState {
  surahs: SurahMeta[];
  downloadedSurahs: number[];
  currentSurahNumber: number;
  isOffline: boolean;
  surahsLoading: boolean;
  surahsError: string | null;
  loadSurahs: () => Promise<void>;
  refreshDownloaded: () => Promise<void>;
  downloadSurah: (
    surahNumber: number,
    onProgress: (pct: number) => void,
    isOnline: boolean,
    options?: { signal?: AbortSignal; includeTafsir?: boolean }
  ) => Promise<void>;
  /**
   * Download every surah not already stored.
   * `includeTafsir: false` saves ayah text only (no tafsir requests).
   */
  downloadAllSurahs: (
    onProgress: (pct: number) => void,
    isOnline: boolean,
    options?: { signal?: AbortSignal; includeTafsir?: boolean }
  ) => Promise<{ failedSurahs: number[]; cancelled: boolean }>;
  removeDownload: (surahNumber: number) => Promise<void>;
  setCurrentSurahNumber: (n: number) => void;
  setOffline: (v: boolean) => void;
}

export const useQuranStore = create<QuranState>((set, get) => ({
  surahs: [],
  downloadedSurahs: [],
  currentSurahNumber: 1,
  isOffline: false,
  surahsLoading: false,
  surahsError: null,

  setOffline: (isOffline) => set({ isOffline }),

  setCurrentSurahNumber: (currentSurahNumber) => set({ currentSurahNumber }),

  refreshDownloaded: async () => {
    const downloadedSurahs = await listDownloadedSurahNumbers();
    set({ downloadedSurahs });
  },

  loadSurahs: async () => {
    set({ surahsLoading: true, surahsError: null });
    try {
      const list = await apiFetchAllSurahs();
      const downloadedSurahs = await listDownloadedSurahNumbers();
      set({ surahs: list, downloadedSurahs, surahsLoading: false });
    } catch {
      const downloadedSurahs = await listDownloadedSurahNumbers();
      set({
        surahs: [],
        downloadedSurahs,
        surahsLoading: false,
        surahsError: ar.couldNotLoadSurahs,
      });
    }
  },

  downloadSurah: async (surahNumber, onProgress, isOnline, options) => {
    const signal = options?.signal;
    const includeTafsir = options?.includeTafsir !== false;
    if (!isOnline) throw new Error(ar.offlineConnectToDownload);
    if (signal?.aborted) throw new BulkDownloadCancelledError();
    onProgress(1);
    const data = await apiFetchSurahWithAyahs(surahNumber);
    if (signal?.aborted) throw new BulkDownloadCancelledError();

    const meta: SurahMeta = {
      number: data.number,
      name: data.name,
      englishName: data.englishName,
      revelationType: data.revelationType,
      numberOfAyahs: data.numberOfAyahs,
    };

    if (!includeTafsir) {
      onProgress(30);
      if (signal?.aborted) throw new BulkDownloadCancelledError();
      await saveFullSurahDownload(meta, data.ayahs, new Map());
      await get().refreshDownloaded();
      onProgress(100);
      return;
    }

    onProgress(6);
    const editions = TAFSIR_SOURCES.map((s) => s.id);
    const totalSteps = data.ayahs.length * editions.length;
    let done = 0;
    const tafsirByAyah = new Map<number, Partial<Record<TafsirEdition, string>>>();

    for (const ayah of data.ayahs) {
      if (signal?.aborted) throw new BulkDownloadCancelledError();
      const perAyah: Partial<Record<TafsirEdition, string>> = {};
      for (const ed of editions) {
        if (signal?.aborted) throw new BulkDownloadCancelledError();
        try {
          const text = await apiFetchTafsir(ayah.numberInQuran, ed);
          perAyah[ed] = text;
        } catch {
          perAyah[ed] = '';
        }
        if (signal?.aborted) throw new BulkDownloadCancelledError();
        done += 1;
        onProgress(10 + Math.round((done / totalSteps) * 90));
      }
      tafsirByAyah.set(ayah.numberInSurah, perAyah);
    }

    if (signal?.aborted) throw new BulkDownloadCancelledError();

    await saveFullSurahDownload(meta, data.ayahs, tafsirByAyah);
    await get().refreshDownloaded();
    onProgress(100);
  },

  downloadAllSurahs: async (onProgress, isOnline, options) => {
    if (!isOnline) throw new Error(ar.offlineConnectToDownload);
    const signal = options?.signal;
    const includeTafsir = options?.includeTafsir !== false;
    await get().refreshDownloaded();
    const have = new Set(get().downloadedSurahs);
    const pending = Array.from({ length: SURAH_COUNT }, (_, i) => i + 1).filter(
      (n) => !have.has(n)
    );
    const total = pending.length;
    const failedSurahs: number[] = [];
    if (total === 0) {
      onProgress(100);
      return { failedSurahs, cancelled: false };
    }
    let index = 0;
    for (const n of pending) {
      if (signal?.aborted) {
        await get().refreshDownloaded();
        return { failedSurahs, cancelled: true };
      }
      try {
        await get().downloadSurah(
          n,
          (p) => {
            onProgress(
              Math.min(100, Math.round(((index + p / 100) / total) * 100))
            );
          },
          true,
          { signal, includeTafsir }
        );
      } catch (e) {
        if (e instanceof BulkDownloadCancelledError) {
          await get().refreshDownloaded();
          return { failedSurahs, cancelled: true };
        }
        failedSurahs.push(n);
      }
      index += 1;
    }
    onProgress(100);
    await get().refreshDownloaded();
    return { failedSurahs, cancelled: false };
  },

  removeDownload: async (surahNumber) => {
    await deleteSurahDownload(surahNumber);
    await get().refreshDownloaded();
  },
}));
