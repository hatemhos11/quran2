import type { TafsirEdition } from '@/types';

export const SURAH_COUNT = 114;

export const MUYASSAR_TAFSIR_ID: TafsirEdition = 'ar.muyassar';

export const DEFAULT_RECITER_ID = 'ar.alafasy';

export const QURAN_CLOUD_AUDIO_EDITIONS_URL =
  'https://api.alquran.cloud/v1/edition/format/audio';

export const FONT_SIZE_MIN = 18;
export const FONT_SIZE_MAX = 48;

/** Official KFGQPC Uthmanic Hafs V22 — Hafs Arabic & Quran Unicode font. */
export const QURAN_FONT_FAMILY = 'HafsQuran';

export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

export const AYAH_ESTIMATE_HEIGHT = 104;

/** Card layout: ayahs loaded per scroll batch. */
export const AYAH_LOAD_CHUNK_SIZE = 12;
export const AYAH_INITIAL_CHUNK_SIZE = 12;

/** Mushaf layout: mushaf pages loaded per scroll batch. */
export const MUSHAF_INITIAL_PAGES = 2;
export const MUSHAF_PAGE_ESTIMATE_HEIGHT = 520;
