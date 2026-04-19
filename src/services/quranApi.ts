import type { Ayah, SurahMeta, SurahWithAyahs } from '@/types';
import { API_BASE, QURAN_EDITION } from '@/utils/constants';

const RETRIES = 3;
const RETRY_DELAY_MS = 600;

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < RETRIES - 1) await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (res.status === 429) {
    await delay(1500);
    const retry = await fetch(url);
    if (!retry.ok) throw new Error(`HTTP ${retry.status}`);
    return retry.json();
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function parseSurahMetaList(payload: unknown): SurahMeta[] {
  const body = payload as { data?: SurahMeta[] };
  if (!body?.data || !Array.isArray(body.data)) throw new Error('Invalid surah list');
  return body.data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    revelationType: s.revelationType,
    numberOfAyahs: s.numberOfAyahs,
  }));
}

interface ApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

type EditionPayload = SurahMeta & { ayahs: ApiAyah[] };

function parseEditionPayload(data: unknown): EditionPayload {
  const edition = Array.isArray(data)
    ? (data as EditionPayload[])[0]
    : (data as EditionPayload);
  if (!edition?.ayahs) throw new Error('No ayahs in response');
  return edition;
}

export async function apiFetchAllSurahs(): Promise<SurahMeta[]> {
  const url = `${API_BASE}/surah`;
  const json = await fetchWithRetry(() => fetchJson(url));
  return parseSurahMetaList(json);
}

export async function apiFetchSurahWithAyahs(surahNumber: number): Promise<SurahWithAyahs> {
  const url = `${API_BASE}/surah/${surahNumber}/editions/${QURAN_EDITION}`;
  const json = await fetchWithRetry(() => fetchJson(url)) as {
    data: unknown;
  };
  const edition = parseEditionPayload(json.data);
  const ayahs: Ayah[] = edition.ayahs.map((a) => ({
    numberInSurah: a.numberInSurah,
    numberInQuran: a.number,
    text: a.text,
  }));
  return {
    number: edition.number,
    name: edition.name,
    englishName: edition.englishName,
    revelationType: edition.revelationType,
    numberOfAyahs: edition.numberOfAyahs,
    ayahs,
  };
}

export async function apiFetchTafsir(globalAyahNumber: number, edition: string): Promise<string> {
  const url = `${API_BASE}/ayah/${globalAyahNumber}/editions/${edition}`;
  const json = await fetchWithRetry(() => fetchJson(url)) as {
    data?: { text?: string }[];
  };
  const block = Array.isArray(json.data) ? json.data[0] : undefined;
  if (!block?.text) return '';
  return block.text;
}
