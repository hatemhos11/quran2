/** Arabic diacritics, tatweel, and Quranic annotation marks. */
const ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u08D4-\u08FF]/g;

/** Unify alef/hamza forms to bare alef (ا). */
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;

/** Alef maksura (ى) -> ya (ي). */
const ALEF_MAKSURA = /\u0649/g;

/** Ta marbuta (ة) -> ha (ه). */
const TA_MARBUTA = /\u0629/g;

export function normalizeArabicForSearch(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, '')
    .replace(ALEF_VARIANTS, '\u0627')
    .replace(ALEF_MAKSURA, '\u064A')
    .replace(TA_MARBUTA, '\u0647');
}

export function matchesArabicSearch(haystack: string, query: string): boolean {
  const normalizedQuery = normalizeArabicForSearch(query.trim());
  if (!normalizedQuery) return true;
  return normalizeArabicForSearch(haystack).includes(normalizedQuery);
}
