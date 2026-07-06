import { Audio, type AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

import { buildAyahAudioUrl } from '@/services/quranAudioApi';
import type { Ayah } from '@/types';

export type AyahAudioTrack = {
  numberInSurah: number;
  numberInQuran: number;
};

let audioModeConfigured = false;

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

export function useAyahAudio(reciterId: string, ayahTracks: AyahAudioTrack[]) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const ayahsRef = useRef(ayahTracks);
  const reciterRef = useRef(reciterId);
  const repeatRef = useRef(false);
  const autoNextRef = useRef(false);
  const currentTrackRef = useRef<AyahAudioTrack | null>(null);
  const advancingRef = useRef(false);
  const finishedForTrackRef = useRef<number | null>(null);
  const loadTrackRef = useRef<(track: AyahAudioTrack, autoplay?: boolean) => Promise<void>>(
    async () => undefined
  );

  const [currentTrack, setCurrentTrack] = useState<AyahAudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);

  useEffect(() => {
    ayahsRef.current = ayahTracks;
  }, [ayahTracks]);

  useEffect(() => {
    reciterRef.current = reciterId;
  }, [reciterId]);

  useEffect(() => {
    repeatRef.current = repeatEnabled;
  }, [repeatEnabled]);

  useEffect(() => {
    autoNextRef.current = autoNextEnabled;
  }, [autoNextEnabled]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const unloadSound = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      await sound.setOnPlaybackStatusUpdate(null);
      await sound.unloadAsync().catch(() => undefined);
    }
  }, []);

  const handlePlaybackFinished = useCallback(async () => {
    if (advancingRef.current) return;

    const track = currentTrackRef.current;
    if (!track) return;

    if (repeatRef.current) {
      const sound = soundRef.current;
      if (sound) {
        await sound.setPositionAsync(0).catch(() => undefined);
        await sound.playAsync().catch(() => undefined);
      }
      return;
    }

    if (autoNextRef.current) {
      const idx = ayahsRef.current.findIndex(
        (a) => a.numberInSurah === track.numberInSurah
      );
      const next = idx >= 0 ? ayahsRef.current[idx + 1] : undefined;
      if (next) {
        advancingRef.current = true;
        try {
          await loadTrackRef.current(
            {
              numberInSurah: next.numberInSurah,
              numberInQuran: next.numberInQuran,
            },
            true
          );
        } finally {
          advancingRef.current = false;
        }
        return;
      }
    }

    setIsPlaying(false);
  }, []);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      setPositionMillis(status.positionMillis);
      setDurationMillis(status.durationMillis ?? 0);
      setIsPlaying(status.isPlaying);

      if (!isPlaybackFinished(status) || advancingRef.current) return;

      const track = currentTrackRef.current;
      if (!track || finishedForTrackRef.current === track.numberInSurah) return;
      finishedForTrackRef.current = track.numberInSurah;

      void handlePlaybackFinished();
    },
    [handlePlaybackFinished]
  );

  const loadTrack = useCallback(
    async (track: AyahAudioTrack, autoplay = true) => {
      await unloadSound();
      finishedForTrackRef.current = null;
      setCurrentTrack(track);
      currentTrackRef.current = track;
      setPositionMillis(0);
      setDurationMillis(0);
      setIsLoading(true);

      try {
        await ensureAudioMode();
        const { sound } = await Audio.Sound.createAsync(
          { uri: buildAyahAudioUrl(reciterRef.current, track.numberInQuran) },
          { shouldPlay: autoplay, progressUpdateIntervalMillis: 200 }
        );
        sound.setOnPlaybackStatusUpdate(handlePlaybackStatus);
        soundRef.current = sound;
        setIsPlaying(autoplay);
      } catch {
        setCurrentTrack(null);
        currentTrackRef.current = null;
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [handlePlaybackStatus, unloadSound]
  );

  useEffect(() => {
    loadTrackRef.current = loadTrack;
  }, [loadTrack]);

  const prevReciterRef = useRef(reciterId);
  useEffect(() => {
    if (prevReciterRef.current === reciterId) return;
    prevReciterRef.current = reciterId;
    const track = currentTrackRef.current;
    if (track) {
      void loadTrack(track, true);
    }
  }, [reciterId, loadTrack]);

  const stop = useCallback(async () => {
    advancingRef.current = false;
    finishedForTrackRef.current = null;
    await unloadSound();
    setCurrentTrack(null);
    currentTrackRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    setPositionMillis(0);
    setDurationMillis(0);
  }, [unloadSound]);

  const togglePlayPause = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }, []);

  const playAyah = useCallback(
    (ayah: Ayah) => {
      const track: AyahAudioTrack = {
        numberInSurah: ayah.numberInSurah,
        numberInQuran: ayah.numberInQuran,
      };

      if (currentTrackRef.current?.numberInQuran === ayah.numberInQuran) {
        void togglePlayPause();
        return;
      }

      void loadTrack(track, true);
    },
    [loadTrack, togglePlayPause]
  );

  const seek = useCallback(async (millis: number) => {
    const sound = soundRef.current;
    if (!sound) return;
    await sound.setPositionAsync(millis).catch(() => undefined);
    setPositionMillis(millis);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatEnabled((v) => {
      const next = !v;
      repeatRef.current = next;
      if (next) {
        autoNextRef.current = false;
        setAutoNextEnabled(false);
      }
      return next;
    });
  }, []);

  const toggleAutoNext = useCallback(() => {
    setAutoNextEnabled((v) => {
      const next = !v;
      autoNextRef.current = next;
      if (next) {
        repeatRef.current = false;
        setRepeatEnabled(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      void unloadSound();
    };
  }, [unloadSound]);

  const isActive = useCallback(
    (numberInQuran: number) => currentTrack?.numberInQuran === numberInQuran,
    [currentTrack]
  );

  const isTrackPlaying = useCallback(
    (numberInQuran: number) =>
      currentTrack?.numberInQuran === numberInQuran && isPlaying,
    [currentTrack, isPlaying]
  );

  const isTrackLoading = useCallback(
    (numberInQuran: number) =>
      isLoading && currentTrack?.numberInQuran === numberInQuran,
    [currentTrack, isLoading]
  );

  return {
    currentTrack,
    isPlaying,
    isLoading,
    positionMillis,
    durationMillis,
    repeatEnabled,
    autoNextEnabled,
    playAyah,
    togglePlayPause,
    stop,
    seek,
    toggleRepeat,
    toggleAutoNext,
    isActive,
    isTrackPlaying,
    isTrackLoading,
    playerVisible: currentTrack != null,
  };
}
