import type { TafsirEdition } from '@/types';

export const SURAH_COUNT = 114;

export const MUYASSAR_TAFSIR_ID: TafsirEdition = 'ar.muyassar';

export const DEFAULT_RECITER_ID = 'ar.alafasy';

export const QURAN_CLOUD_AUDIO_EDITIONS_URL =
  'https://api.alquran.cloud/v1/edition/format/audio';

export const FONT_SIZE_MIN = 18;
export const FONT_SIZE_MAX = 48;

/** Scheherazade New — clear Arabic naskh for Quranic text with tashkeel. */
export const QURAN_FONT_FAMILY = 'ScheherazadeNew_400Regular';

export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

export const AYAH_ESTIMATE_HEIGHT = 104;

/** Card layout: ayahs per infinite-scroll page. */
export const SURAH_AYAH_PAGE_SIZE = 40;

/** Mushaf layout: mushaf pages fetched per infinite-scroll step. */
export const SURAH_MUSHAF_PAGES_PER_LOAD = 20;

export const MUSHAF_PAGE_ESTIMATE_HEIGHT = 520;
export const AYAH_PAGE_ESTIMATE_HEIGHT = AYAH_ESTIMATE_HEIGHT * 6;
