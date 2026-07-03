import type { AudioReciter } from '@/types';
import { QURAN_CLOUD_AUDIO_EDITIONS_URL } from '@/utils/constants';

export function ayahAudioKey(reciterId: string, numberInQuran: number): string {
  return `${reciterId}:${numberInQuran}`;
}

export function buildAyahAudioUrl(reciterId: string, numberInQuran: number): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${numberInQuran}.mp3`;
}

export async function fetchAudioReciters(): Promise<AudioReciter[]> {
  const res = await fetch(QURAN_CLOUD_AUDIO_EDITIONS_URL);
  if (!res.ok) {
    throw new Error(`Failed to load reciters (${res.status})`);
  }
  const json = (await res.json()) as { data?: AudioReciter[] };
  return json.data ?? [];
}
