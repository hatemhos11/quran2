import type { TafsirEdition } from '@/types';

export const API_BASE = 'https://api.alquran.cloud/v1';

/** Number of surahs in the Quran (for bulk offline download). */
export const SURAH_COUNT = 114;

export const QURAN_EDITION = 'quran-uthmani';

export const TAFSIR_SOURCES: { id: TafsirEdition; label: string }[] = [
  { id: 'ar.muyassar', label: 'الميسر' },
  { id: 'ar.jalalayn', label: 'الجلالين' },
  { id: 'ar.baghawy', label: 'البغوي' },
  { id: 'ar.qurtubi', label: 'القرطبي' },
];

export const FONT_SIZE_MIN = 24;
export const FONT_SIZE_MAX = 48;

export const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

export const AYAH_ESTIMATE_HEIGHT = 104;
