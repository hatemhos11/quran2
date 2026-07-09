import { Audio, type AVPlaybackStatus } from 'expo-av';
import { create } from 'zustand';

import { buildAyahAudioUrl } from '@/services/quranAudioApi';
import { useSettingsStore } from '@/store/settingsStore';
import type { Ayah } from '@/types';

export type AyahAudioTrack = {
  surahNumber: number;
  surahName: string;
  numberInSurah: number;
  numberInQuran: number;
};

type PlaylistTrack = Pick<AyahAudioTrack, 'numberInSurah' | 'numberInQuran'>;

type AyahAudioState = {
  currentTrack: AyahAudioTrack | null;
  playlist: PlaylistTrack[];
  playlistSurahNumber: number | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  repeatEnabled: boolean;
  autoNextEnabled: boolean;
  setPlaylist: (
    surahNumber: number,
    tracks: PlaylistTrack[],
  ) => void;
  playAyah: (
    ayah: Pick<Ayah, 'numberInSurah' | 'numberInQuran'>,
    context: { surahNumber: number; surahName: string },
  ) => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (millis: number) => void;
  toggleRepeat: () => void;
  toggleAutoNext: () => void;
  isActive: (numberInQuran: number) => boolean;
  isTrackPlaying: (numberInQuran: number) => boolean;
  isTrackLoading: (numberInQuran: number) => boolean;
};

let audioModeConfigured = false;
let sound: Audio.Sound | null = null;
let advancing = false;
let finishedForTrack: number | null = null;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
  audioModeConfigured = true;
}

function isPlaybackFinished(status: AVPlaybackStatus): boolean {
  if (!status.isLoaded) return false;
  if (status.didJustFinish) return true;
  return (
    status.durationMillis != null &&
    status.durationMillis > 0 &&
    status.positionMillis >= status.durationMillis - 350 &&
    !status.isPlaying
  );
}

async function unloadSound(): Promise<void> {
  const current = sound;
  sound = null;
  if (!current) return;
  await current.setOnPlaybackStatusUpdate(null);
  await current.unloadAsync().catch(() => undefined);
}

async function loadTrack(
  track: AyahAudioTrack,
  autoplay = true,
): Promise<void> {
  await unloadSound();
  finishedForTrack = null;
  useAyahAudioStore.setState({
    currentTrack: track,
    positionMillis: 0,
    durationMillis: 0,
    isLoading: true,
  });

  try {
    await ensureAudioMode();
    const reciterId = useSettingsStore.getState().preferredReciter;
    const created = await Audio.Sound.createAsync(
      { uri: buildAyahAudioUrl(reciterId, track.numberInQuran) },
      { shouldPlay: autoplay, progressUpdateIntervalMillis: 200 },
    );
    sound = created.sound;
    sound.setOnPlaybackStatusUpdate(handlePlaybackStatus);
    useAyahAudioStore.setState({ isPlaying: autoplay });
  } catch {
    useAyahAudioStore.setState({
      currentTrack: null,
      isPlaying: false,
    });
  } finally {
    useAyahAudioStore.setState({ isLoading: false });
  }
}

async function handlePlaybackFinished(): Promise<void> {
  if (advancing) return;

  const { currentTrack, repeatEnabled, autoNextEnabled, playlist } =
    useAyahAudioStore.getState();
  if (!currentTrack) return;

  if (repeatEnabled) {
    if (sound) {
      await sound.setPositionAsync(0).catch(() => undefined);
      await sound.playAsync().catch(() => undefined);
    }
    return;
  }

  if (autoNextEnabled) {
    const idx = playlist.findIndex(
      (a) => a.numberInSurah === currentTrack.numberInSurah,
    );
    const next = idx >= 0 ? playlist[idx + 1] : undefined;
    if (next) {
      advancing = true;
      try {
        await loadTrack(
          {
            surahNumber: currentTrack.surahNumber,
            surahName: currentTrack.surahName,
            numberInSurah: next.numberInSurah,
            numberInQuran: next.numberInQuran,
          },
          true,
        );
      } finally {
        advancing = false;
      }
      return;
    }
  }

  useAyahAudioStore.setState({ isPlaying: false });
}

function handlePlaybackStatus(status: AVPlaybackStatus): void {
  if (!status.isLoaded) return;

  useAyahAudioStore.setState({
    positionMillis: status.positionMillis,
    durationMillis: status.durationMillis ?? 0,
    isPlaying: status.isPlaying,
  });

  if (!isPlaybackFinished(status) || advancing) return;

  const track = useAyahAudioStore.getState().currentTrack;
  if (!track || finishedForTrack === track.numberInQuran) return;
  finishedForTrack = track.numberInQuran;

  void handlePlaybackFinished();
}

let prevReciterId = useSettingsStore.getState().preferredReciter;
useSettingsStore.subscribe((state) => {
  if (state.preferredReciter === prevReciterId) return;
  prevReciterId = state.preferredReciter;
  const track = useAyahAudioStore.getState().currentTrack;
  if (track) {
    void loadTrack(track, true);
  }
});

export const useAyahAudioStore = create<AyahAudioState>((set, get) => ({
  currentTrack: null,
  playlist: [],
  playlistSurahNumber: null,
  isPlaying: false,
  isLoading: false,
  positionMillis: 0,
  durationMillis: 0,
  repeatEnabled: false,
  autoNextEnabled: true,

  setPlaylist: (surahNumber, tracks) => {
    set({ playlistSurahNumber: surahNumber, playlist: tracks });
  },

  playAyah: (ayah, context) => {
    const current = get().currentTrack;
    if (current?.numberInQuran === ayah.numberInQuran) {
      void get().togglePlayPause();
      return;
    }

    void loadTrack(
      {
        surahNumber: context.surahNumber,
        surahName: context.surahName,
        numberInSurah: ayah.numberInSurah,
        numberInQuran: ayah.numberInQuran,
      },
      true,
    );
  },

  togglePlayPause: () => {
    void (async () => {
      if (!sound) return;
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    })();
  },

  stop: () => {
    void (async () => {
      advancing = false;
      finishedForTrack = null;
      await unloadSound();
      set({
        currentTrack: null,
        isPlaying: false,
        isLoading: false,
        positionMillis: 0,
        durationMillis: 0,
      });
    })();
  },

  seek: (millis) => {
    void (async () => {
      if (!sound) return;
      await sound.setPositionAsync(millis).catch(() => undefined);
      set({ positionMillis: millis });
    })();
  },

  toggleRepeat: () => {
    set((state) => {
      const repeatEnabled = !state.repeatEnabled;
      return {
        repeatEnabled,
        autoNextEnabled: repeatEnabled ? false : state.autoNextEnabled,
      };
    });
  },

  toggleAutoNext: () => {
    set((state) => {
      const autoNextEnabled = !state.autoNextEnabled;
      return {
        autoNextEnabled,
        repeatEnabled: autoNextEnabled ? false : state.repeatEnabled,
      };
    });
  },

  isActive: (numberInQuran) =>
    get().currentTrack?.numberInQuran === numberInQuran,

  isTrackPlaying: (numberInQuran) => {
    const { currentTrack, isPlaying } = get();
    return currentTrack?.numberInQuran === numberInQuran && isPlaying;
  },

  isTrackLoading: (numberInQuran) => {
    const { currentTrack, isLoading } = get();
    return isLoading && currentTrack?.numberInQuran === numberInQuran;
  },
}));
