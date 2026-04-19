export type RevelationType = 'Meccan' | 'Medinan';

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation?: string;
  revelationType: RevelationType;
  numberOfAyahs: number;
}

export interface Ayah {
  numberInSurah: number;
  numberInQuran: number;
  text: string;
}

export interface SurahWithAyahs extends SurahMeta {
  ayahs: Ayah[];
}

export type ReadingFontId = 'amiri' | 'scheherazade' | 'system';

export type ThemeMode = 'light' | 'dark';

export type TafsirEdition = 'ar.muyassar' | 'ar.jalalayn' | 'ar.baghawy' | 'ar.qurtubi';

export interface TafsirRow {
  source: string;
  text: string;
}
