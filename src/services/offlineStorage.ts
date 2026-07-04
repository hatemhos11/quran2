import * as SQLite from 'expo-sqlite';
import { importDatabaseFromAssetAsync } from 'expo-sqlite';

import type { Ayah, AzkarCategory, AzkarItem, SurahMeta, SurahWithAyahs } from '@/types';
import { matchesArabicSearch } from '@/utils/arabicSearch';

const DB_NAME = 'quran_reader.db';
const DB_ASSET_ID = require('../../assets/quran_reader.db');

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

async function isBundledDbStale(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    const table = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='azkar'"
    );
    if (!table) return true;
    const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM azkar');
    return (row?.c ?? 0) === 0;
  } catch {
    return true;
  }
}

export async function openBundledDatabase(): Promise<void> {
  let db = await SQLite.openDatabaseAsync(DB_NAME);

  if (await isBundledDbStale(db)) {
    await db.closeAsync();
    await importDatabaseFromAssetAsync(DB_NAME, {
      assetId: DB_ASSET_ID,
      forceOverwrite: true,
    });
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }

  await initBundledDb(db);
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

export async function loadAzkarCategories(): Promise<AzkarCategory[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; itemCount: number }>(
    `SELECT category, COUNT(*) AS itemCount
     FROM azkar
     GROUP BY category
     ORDER BY MIN(sortOrder)`
  );
  return rows.map((r) => ({ name: r.category, itemCount: r.itemCount }));
}

export async function loadAzkarByCategory(category: string): Promise<AzkarItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    category: string;
    text: string;
    count: number;
    description: string | null;
    reference: string | null;
  }>(
    `SELECT id, category, text, count, description, reference
     FROM azkar
     WHERE category = ?
     ORDER BY sortOrder`,
    [category]
  );
  return rows;
}

export async function searchAzkarCategories(query: string): Promise<AzkarCategory[]> {
  const q = query.trim();
  if (!q) return loadAzkarCategories();

  const db = await getDb();
  const rows = await db.getAllAsync<{
    category: string;
    text: string;
    description: string | null;
  }>(`SELECT category, text, description FROM azkar ORDER BY sortOrder`);

  const matchCountByCategory = new Map<string, number>();
  for (const row of rows) {
    const searchable = [row.category, row.text, row.description ?? ''];
    if (!searchable.some((part) => matchesArabicSearch(part, q))) continue;
    matchCountByCategory.set(row.category, (matchCountByCategory.get(row.category) ?? 0) + 1);
  }

  const categories = await loadAzkarCategories();
  return categories
    .filter((category) => matchCountByCategory.has(category.name))
    .map((category) => ({
      ...category,
      itemCount: matchCountByCategory.get(category.name) ?? category.itemCount,
    }));
}
