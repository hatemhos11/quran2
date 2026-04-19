import type { SurahMeta } from '@/types';
import { SURAH_COUNT, TAFSIR_SOURCES } from '@/utils/constants';

/** Hafs — total ayāt used when surah metadata is not loaded yet. */
export const TOTAL_QURAN_AYAHS = 6236;

/**
 * Rough UTF-8 transfer/storage order of magnitude for one ayah’s Uthmani text
 * (api JSON + DB).
 */
const APPROX_BYTES_PER_AYAH_TEXT = 200;

/**
 * Rough average per ayah per tafsir edition (four sources × all ayahs dominates size).
 */
const APPROX_BYTES_PER_TAFSIR_PER_AYAH = 2800;

/** Quran text only (no tafsir) for `ayahCount` ayāt. */
export function estimateTextOnlyBytesForAyahCount(ayahCount: number): number {
  return ayahCount * APPROX_BYTES_PER_AYAH_TEXT;
}

/** Estimated bytes for Quran text + all configured tafsir editions for `ayahCount` ayāt. */
export function estimateOfflineTransferBytesForAyahCount(ayahCount: number): number {
  const text = ayahCount * APPROX_BYTES_PER_AYAH_TEXT;
  const tafsir =
    ayahCount * TAFSIR_SOURCES.length * APPROX_BYTES_PER_TAFSIR_PER_AYAH;
  return text + tafsir;
}

/** Full Mushaf offline package (all surahs, all tafsir sources in app config). */
export function estimateFullOfflinePackageBytes(): number {
  return estimateOfflineTransferBytesForAyahCount(TOTAL_QURAN_AYAHS);
}

/** Text-only full Quran (no tafsir). */
export function estimateFullTextOnlyPackageBytes(): number {
  return estimateTextOnlyBytesForAyahCount(TOTAL_QURAN_AYAHS);
}

function countAyahsRemainingForBulk(
  surahs: SurahMeta[],
  downloadedNumbers: number[]
): number {
  const have = new Set(downloadedNumbers);
  if (surahs.length >= SURAH_COUNT) {
    let ayahsLeft = 0;
    for (const s of surahs) {
      if (!have.has(s.number)) ayahsLeft += s.numberOfAyahs;
    }
    return ayahsLeft;
  }
  const remainingSurahs = Math.max(0, SURAH_COUNT - have.size);
  const avgAyahsPerSurah = TOTAL_QURAN_AYAHS / SURAH_COUNT;
  return Math.round(remainingSurahs * avgAyahsPerSurah);
}

/**
 * Bytes still to download for “download all” (surahs not in `downloadedNumbers`).
 * `includeTafsir`: full package vs text-only.
 */
export function estimateRemainingBulkDownloadBytes(
  surahs: SurahMeta[],
  downloadedNumbers: number[],
  includeTafsir: boolean
): number {
  const ayahsLeft = countAyahsRemainingForBulk(surahs, downloadedNumbers);
  return includeTafsir
    ? estimateOfflineTransferBytesForAyahCount(ayahsLeft)
    : estimateTextOnlyBytesForAyahCount(ayahsLeft);
}
