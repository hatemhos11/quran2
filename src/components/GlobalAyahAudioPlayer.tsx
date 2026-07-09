import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AyahAudioPlayer } from '@/components/AyahAudioPlayer';
import { useAyahAudioStore } from '@/store/ayahAudioStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppColors } from '@/utils/theme';

export const GLOBAL_AUDIO_PLAYER_HEIGHT = 118;

type Props = {
  bottomOffset?: number;
};

export function GlobalAyahAudioPlayer({ bottomOffset = 0 }: Props) {
  const isDark = useSettingsStore((s) => s.theme) === 'dark';
  const c = getAppColors(isDark);

  const currentTrack = useAyahAudioStore((s) => s.currentTrack);
  const isPlaying = useAyahAudioStore((s) => s.isPlaying);
  const isLoading = useAyahAudioStore((s) => s.isLoading);
  const positionMillis = useAyahAudioStore((s) => s.positionMillis);
  const durationMillis = useAyahAudioStore((s) => s.durationMillis);
  const repeatEnabled = useAyahAudioStore((s) => s.repeatEnabled);
  const autoNextEnabled = useAyahAudioStore((s) => s.autoNextEnabled);
  const togglePlayPause = useAyahAudioStore((s) => s.togglePlayPause);
  const seek = useAyahAudioStore((s) => s.seek);
  const toggleRepeat = useAyahAudioStore((s) => s.toggleRepeat);
  const toggleAutoNext = useAyahAudioStore((s) => s.toggleAutoNext);
  const stop = useAyahAudioStore((s) => s.stop);

  if (!currentTrack) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: bottomOffset,
          backgroundColor: c.surfaceElevated,
          borderTopColor: c.border,
          shadowColor: c.cardShadow,
        },
      ]}
    >
      <AyahAudioPlayer
        isDark={isDark}
        surahName={currentTrack.surahName}
        ayahNumber={currentTrack.numberInSurah}
        isPlaying={isPlaying}
        isLoading={isLoading}
        positionMillis={positionMillis}
        durationMillis={durationMillis}
        repeatEnabled={repeatEnabled}
        autoNextEnabled={autoNextEnabled}
        onTogglePlayPause={togglePlayPause}
        onSeek={seek}
        onToggleRepeat={toggleRepeat}
        onToggleAutoNext={toggleAutoNext}
        onClose={stop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
});
