import { getDb } from '@/services/offlineStorage';
import dbJson from '@/store/quran-db.json';
import tafsirJson from '@/store/Tafsir Muyassar.json';
import { MUYASSAR_TAFSIR_ID } from '@/utils/constants';

type SajdaValue =
  | false
  | {
      id: number;
      recommended: boolean;
      obligatory: boolean;
    };

interface JsonAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: SajdaValue;
}

interface JsonSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: JsonAyah[];
}

interface TafsirEntry {
  text: string;
}

type TafsirJson = Record<string, TafsirEntry | string>;

function resolveTafsirText(data: TafsirJson, key: string, visited = new Set<string>()): string | null {
  if (visited.has(key)) return null;
  visited.add(key);
  const entry = data[key];
  if (!entry) return null;
  if (typeof entry === 'string') {
    return resolveTafsirText(data, entry, visited);
  }
  return entry.text || null;
}

const TAFSIR_EDITION = {
  identifier: MUYASSAR_TAFSIR_ID,
  language: 'ar',
  name: 'تفسير الميسر',
  englishName: 'Muyassar',
  format: 'text',
  type: 'tafsir',
} as const;

function parseSajda(sajda: SajdaValue): {
  sajda: number;
  sajdaId: number | null;
  sajdaRecommended: number | null;
  sajdaObligatory: number | null;
} {
  if (sajda === false) {
    return {
      sajda: 0,
      sajdaId: null,
      sajdaRecommended: null,
      sajdaObligatory: null,
    };
  }
  return {
    sajda: 1,
    sajdaId: sajda.id,
    sajdaRecommended: sajda.recommended ? 1 : 0,
    sajdaObligatory: sajda.obligatory ? 1 : 0,
  };
}

async function seedQuranTextIfNeeded(): Promise<void> {
  const db = await getDb();
  const edition = dbJson.edition;

  const existing = await db.getFirstAsync<{ identifier: string }>(
    'SELECT identifier FROM editions WHERE identifier = ?',
    [edition.identifier]
  );
  if (existing) return;

  try {
    await db.execAsync('BEGIN IMMEDIATE');

    await db.runAsync(
      `INSERT INTO editions (identifier, language, name, englishName, format, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        edition.identifier,
        edition.language,
        edition.name,
        edition.englishName,
        edition.format,
        edition.type,
      ]
    );

    for (const surah of dbJson.surahs as JsonSurah[]) {
      await db.runAsync(
        `INSERT OR IGNORE INTO surahs (
          id, name, englishName, englishNameTranslation, revelationType,
          numberOfAyahs, downloadedAt, seeded
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1)`,
        [
          surah.number,
          surah.name,
          surah.englishName,
          surah.englishNameTranslation,
          surah.revelationType,
          surah.ayahs.length,
        ]
      );

      for (const ayah of surah.ayahs) {
        const sajdaFields = parseSajda(ayah.sajda);
        await db.runAsync(
          `INSERT OR IGNORE INTO ayahs (
            surahId, numberInSurah, text, numberInQuran,
            juz, manzil, page, ruku, hizbQuarter,
            sajda, sajdaId, sajdaRecommended, sajdaObligatory
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            surah.number,
            ayah.numberInSurah,
            ayah.text,
            ayah.number,
            ayah.juz,
            ayah.manzil,
            ayah.page,
            ayah.ruku,
            ayah.hizbQuarter,
            sajdaFields.sajda,
            sajdaFields.sajdaId,
            sajdaFields.sajdaRecommended,
            sajdaFields.sajdaObligatory,
          ]
        );
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

async function seedTafsirIfNeeded(): Promise<void> {
  const db = await getDb();

  const existing = await db.getFirstAsync<{ identifier: string }>(
    'SELECT identifier FROM editions WHERE identifier = ?',
    [TAFSIR_EDITION.identifier]
  );
  if (existing) return;

  const ayahRows = await db.getAllAsync<{
    id: number;
    surahId: number;
    numberInSurah: number;
  }>('SELECT id, surahId, numberInSurah FROM ayahs');
  const ayahIdByKey = new Map<string, number>();
  for (const row of ayahRows) {
    ayahIdByKey.set(`${row.surahId}:${row.numberInSurah}`, row.id);
  }

  try {
    await db.execAsync('BEGIN IMMEDIATE');

    await db.runAsync(
      `INSERT INTO editions (identifier, language, name, englishName, format, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        TAFSIR_EDITION.identifier,
        TAFSIR_EDITION.language,
        TAFSIR_EDITION.name,
        TAFSIR_EDITION.englishName,
        TAFSIR_EDITION.format,
        TAFSIR_EDITION.type,
      ]
    );

    const tafsirData = tafsirJson as TafsirJson;

    for (const [key, entry] of Object.entries(tafsirData)) {
      const ayahId = ayahIdByKey.get(key);
      if (!ayahId) continue;
      const text = typeof entry === 'string' ? resolveTafsirText(tafsirData, key) : entry.text;
      if (!text) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO tafsir (ayahId, source, text) VALUES (?, ?, ?)`,
        [ayahId, MUYASSAR_TAFSIR_ID, text]
      );
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

export async function seedQuranDb(): Promise<void> {
  await seedQuranTextIfNeeded();
  await seedTafsirIfNeeded();
}
