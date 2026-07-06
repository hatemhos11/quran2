import type { ImageSourcePropType } from 'react-native';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/** Decorative frame for ayah numbers (`assets/VerseNum.png`). */
export const verseNumMarkerImage: ImageSourcePropType =
	require('../../assets/VerseNum.png');

/** Ornate Quran-style opening/closing ayah brackets. */
export const AYAH_MARKER_OPEN = '\uFD3F';
export const AYAH_MARKER_CLOSE = '\uFD3E';

/** Eastern Arabic numerals (٠١٢…) for ayah markers. */
export function convertToArabicNumerals(num: number): string {
  return String(num)
    .split('')
    .map((d) => ARABIC_DIGITS[parseInt(d, 10)] ?? d)
    .join('');
}

/** Ornate Quran-style parentheses: ﴿ … ﴾ */
export function ayahEndMarker(numberInSurah: number): string {
  return `${AYAH_MARKER_OPEN}${convertToArabicNumerals(numberInSurah)}${AYAH_MARKER_CLOSE}`;
}
