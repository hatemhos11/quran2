import type { Ayah } from '@/types';
import { formatAyahDisplayText } from '@/utils/ayahText';
import { isBasmalah, removeBasmalah } from '@/utils/startWithBasmalah';

export function prepareAyahForDisplay(
  ayah: Ayah,
  options?: { stripLeadingBasmalah?: boolean },
): Ayah {
  let text = ayah.text;
  if (
    options?.stripLeadingBasmalah &&
    ayah.numberInSurah === 1 &&
    ayah.numberInQuran !== 1 &&
    isBasmalah(text)
  ) {
    text = removeBasmalah(text);
  }
  return { ...ayah, text: formatAyahDisplayText(text) };
}

export function prepareAyahBatch(
  ayahs: Ayah[],
  options?: { stripLeadingBasmalah?: boolean },
): Ayah[] {
  return ayahs.map((ayah) => prepareAyahForDisplay(ayah, options));
}
