import type { ReadingFontId } from '@/types';

const MAP: Record<ReadingFontId, string | undefined> = {
  scheherazade: 'ScheherazadeNew_400Regular',
  system: undefined,
};

export function getArabicFontFamily(readingFont: ReadingFontId): string | undefined {
  return MAP[readingFont];
}
