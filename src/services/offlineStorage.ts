import * as SQLite from 'expo-sqlite';

import type { Ayah, SurahMeta, SurahWithAyahs } from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function setDbInstance(db: SQLite.SQLiteDatabase): void {
  dbInstance = db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    throw new Error('Database is not initialized');
  }
  return dbInstance;
}

export async function initBundledDb(db: SQLite.SQLiteDatabase): Promise<void> {
  setDbInstance(db);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
}

export async function loadAllSurahs(): Promise<SurahMeta[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    englishName: string;
    englishNameTranslation: string | null;
    revelationType: string;
    numberOfAyahs: number;
  }>(
    `SELECT id, name, englishName, englishNameTranslation, revelationType, numberOfAyahs
     FROM surahs ORDER BY id`
  );
  return rows.map((r) => ({
    number: r.id,
    name: r.name,
    englishName: r.englishName,
    englishNameTranslation: r.englishNameTranslation ?? undefined,
    revelationType: r.revelationType as SurahMeta['revelationType'],
    numberOfAyahs: r.numberOfAyahs,
  }));
}

export async function loadSurahOffline(surahNumber: number): Promise<SurahWithAyahs | null> {
  const db = await getDb();
  const surah = await db.getFirstAsync<{
    id: number;
    name: string;
    englishName: string;
    englishNameTranslation: string | null;
    revelationType: string;
    numberOfAyahs: number;
  }>('SELECT * FROM surahs WHERE id = ?', [surahNumber]);
  if (!surah) return null;
  const ayahRows = await db.getAllAsync<{
    numberInSurah: number;
    numberInQuran: number;
    text: string;
  }>(
    'SELECT numberInSurah, numberInQuran, text FROM ayahs WHERE surahId = ? ORDER BY numberInSurah ASC',
    [surahNumber]
  );
  const ayahs: Ayah[] = ayahRows.map((r) => ({
    numberInSurah: r.numberInSurah,
    numberInQuran: r.numberInQuran,
    text: r.text,
  }));
  return {
    number: surah.id,
    name: surah.name,
    englishName: surah.englishName,
    englishNameTranslation: surah.englishNameTranslation ?? undefined,
    revelationType: surah.revelationType as SurahWithAyahs['revelationType'],
    numberOfAyahs: surah.numberOfAyahs,
    ayahs,
  };
}

export async function getAyahRowId(surahNumber: number, numberInSurah: number): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM ayahs WHERE surahId = ? AND numberInSurah = ?',
    [surahNumber, numberInSurah]
  );
  return row?.id ?? null;
}

export async function loadTafsirOffline(
  surahNumber: number,
  numberInSurah: number,
  source: string
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ text: string }>(
    `SELECT t.text FROM tafsir t
     JOIN ayahs a ON a.id = t.ayahId
     WHERE a.surahId = ? AND a.numberInSurah = ? AND t.source = ?`,
    [surahNumber, numberInSurah, source]
  );
  return row?.text ?? null;
}
