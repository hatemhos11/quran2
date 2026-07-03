import * as SQLite from 'expo-sqlite';

import type { Ayah, SurahMeta, SurahWithAyahs } from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('quran_reader.db');
  }
  return dbInstance;
}

async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function initOfflineDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS surahs (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      englishName TEXT NOT NULL,
      revelationType TEXT NOT NULL,
      numberOfAyahs INTEGER NOT NULL,
      downloadedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS ayahs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surahId INTEGER NOT NULL,
      numberInSurah INTEGER NOT NULL,
      text TEXT NOT NULL,
      numberInQuran INTEGER NOT NULL,
      UNIQUE(surahId, numberInSurah),
      FOREIGN KEY (surahId) REFERENCES surahs(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tafsir (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ayahId INTEGER NOT NULL,
      source TEXT NOT NULL,
      text TEXT NOT NULL,
      UNIQUE(ayahId, source),
      FOREIGN KEY (ayahId) REFERENCES ayahs(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS editions (
      identifier TEXT PRIMARY KEY NOT NULL,
      language TEXT NOT NULL,
      name TEXT NOT NULL,
      englishName TEXT NOT NULL,
      format TEXT NOT NULL,
      type TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON ayahs(surahId);
  `);

  await addColumnIfMissing(db, 'surahs', 'englishNameTranslation', 'TEXT');
  await addColumnIfMissing(db, 'surahs', 'seeded', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'ayahs', 'juz', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'manzil', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'page', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'ruku', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'hizbQuarter', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'sajda', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'ayahs', 'sajdaId', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'sajdaRecommended', 'INTEGER');
  await addColumnIfMissing(db, 'ayahs', 'sajdaObligatory', 'INTEGER');
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
