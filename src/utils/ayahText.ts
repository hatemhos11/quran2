/** Normalize Quranic ayah text for Uthmanic Hafs Unicode display. */
export function formatAyahDisplayText(text: string): string {
  return text
    .replace(/\ufeff/g, '')
    .replace(/[\u00a0\u202f\u2009]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
