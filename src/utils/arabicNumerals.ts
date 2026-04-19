import type { ImageSourcePropType } from 'react-native';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/** Decorative frame for ayah numbers (`assets/VerseNum.png`). */
export const verseNumMarkerImage: ImageSourcePropType =
	require('../../assets/VerseNum.png');

/** Eastern Arabic numerals (٠١٢…) for ayah markers. */
export function convertToArabicNumerals(num: number): string {
  return String(num)
    .split('')
    .map((d) => ARABIC_DIGITS[parseInt(d, 10)] ?? d)
    .join('');
}

/** Ornate Quran-style parentheses: U+FD3F … U+FD3E */
export function ayahEndMarker(numberInSurah: number): string {
  return `\uFD3F${convertToArabicNumerals(numberInSurah)}\uFD3E`;
}
