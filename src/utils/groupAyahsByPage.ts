import type { Ayah } from '@/types';

export type MushafPageGroup = {
  page: number;
  ayahs: Ayah[];
};

export function groupAyahsByPage(ayahs: Ayah[]): MushafPageGroup[] {
  if (!ayahs.length) return [];

  const groups: MushafPageGroup[] = [];
  let currentPage = ayahs[0].page;
  let currentAyahs: Ayah[] = [];

  for (const ayah of ayahs) {
    if (ayah.page !== currentPage && currentAyahs.length > 0) {
      groups.push({ page: currentPage, ayahs: currentAyahs });
      currentAyahs = [];
      currentPage = ayah.page;
    }
    currentPage = ayah.page;
    currentAyahs.push(ayah);
  }

  if (currentAyahs.length > 0) {
    groups.push({ page: currentPage, ayahs: currentAyahs });
  }

  return groups;
}
