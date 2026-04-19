import * as SQLite from 'expo-sqlite';

import type { Ayah, SurahMeta, SurahWithAyahs, TafsirEdition } from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('quran_reader.db');
  }
  return dbInstance;
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
    CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON ayahs(surahId);
  `);
}

export async function isSurahDownloaded(surahNumber: number): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM surahs WHERE id = ? AND downloadedAt IS NOT NULL',
    [surahNumber]
  );
  return (row?.c ?? 0) > 0;
}

export async function listDownloadedSurahNumbers(): Promise<number[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM surahs WHERE downloadedAt IS NOT NULL ORDER BY id'
  );
  return rows.map((r) => r.id);
}

export async function loadSurahOffline(surahNumber: number): Promise<SurahWithAyahs | null> {
  const db = await getDb();
  const surah = await db.getFirstAsync<{
    id: number;
    name: string;
    englishName: string;
    revelationType: string;
    numberOfAyahs: number;
  }>('SELECT * FROM surahs WHERE id = ? AND downloadedAt IS NOT NULL', [surahNumber]);
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

export async function saveTafsirLine(
  ayahId: number,
  source: string,
  text: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO tafsir (ayahId, source, text)
     VALUES (?, ?, ?)`,
    [ayahId, source, text]
  );
}

export async function deleteSurahDownload(surahNumber: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM surahs WHERE id = ?', [surahNumber]);
}

export async function saveFullSurahDownload(
  meta: SurahMeta,
  ayahs: Ayah[],
  tafsirByAyah: Map<number, Partial<Record<TafsirEdition, string>>>
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  try {
    await db.execAsync('BEGIN IMMEDIATE');
    await db.runAsync('DELETE FROM surahs WHERE id = ?', [meta.number]);
    await db.runAsync(
      `INSERT INTO surahs (id, name, englishName, revelationType, numberOfAyahs, downloadedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        meta.number,
        meta.name,
        meta.englishName,
        meta.revelationType,
        meta.numberOfAyahs,
        now,
      ]
    );
    for (const a of ayahs) {
      await db.runAsync(
        `INSERT INTO ayahs (surahId, numberInSurah, text, numberInQuran)
         VALUES (?, ?, ?, ?)`,
        [meta.number, a.numberInSurah, a.text, a.numberInQuran]
      );
      const row = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM ayahs WHERE surahId = ? AND numberInSurah = ?',
        [meta.number, a.numberInSurah]
      );
      if (!row) continue;
      const editions = tafsirByAyah.get(a.numberInSurah);
      if (!editions) continue;
      for (const [src, txt] of Object.entries(editions)) {
        if (txt) {
          await db.runAsync(`INSERT INTO tafsir (ayahId, source, text) VALUES (?, ?, ?)`, [
            row.id,
            src,
            txt,
          ]);
        }
      }
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    try {
      await db.execAsync('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM surahs');
}

export async function getApproxStorageBytes(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT IFNULL(SUM(LENGTH(text)), 0) as n FROM ayahs'
  );
  const row2 = await db.getFirstAsync<{ n: number }>(
    'SELECT IFNULL(SUM(LENGTH(text)), 0) as n FROM tafsir'
  );
  return (row?.n ?? 0) + (row2?.n ?? 0);
}
