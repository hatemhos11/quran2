import Slider from '@react-native-community/slider';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { ar } from '@/i18n/ar';
import { formatMillis } from '@/utils/formatTime';
import { sp } from '@/utils/spacing';
import { getAppColors } from '@/utils/theme';

type Props = {
  isDark: boolean;
  surahName?: string;
  ayahNumber: number;
  isPlaying: boolean;
  isLoading: boolean;
  positionMillis: number;
  durationMillis: number;
  repeatEnabled: boolean;
  autoNextEnabled: boolean;
  onTogglePlayPause: () => void;
  onSeek: (position: number) => void;
  onToggleRepeat: () => void;
  onToggleAutoNext: () => void;
  onClose: () => void;
};

function ControlButton({
  icon,
  active,
  onPress,
  accessibilityLabel,
  accent,
  muted,
  isDark,
  size = 22,
}: {
  icon: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accent: string;
  muted: string;
  isDark: boolean;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.controlBtn,
        {
          backgroundColor: active
            ? `${accent}22`
            : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(44,62,80,0.06)',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <IconButton
        icon={icon}
        size={size}
        onPress={onPress}
        iconColor={active ? accent : muted}
        style={styles.controlIcon}
      />
    </Pressable>
  );
}

export function AyahAudioPlayer({
  isDark,
  surahName,
  ayahNumber,
  isPlaying,
  isLoading,
  positionMillis,
  durationMillis,
  repeatEnabled,
  autoNextEnabled,
  onTogglePlayPause,
  onSeek,
  onToggleRepeat,
  onToggleAutoNext,
  onClose,
}: Props) {
  const c = getAppColors(isDark);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const maxDuration = Math.max(durationMillis, 1);
  const sliderValue = seeking ? seekValue : positionMillis;
  const title = surahName
    ? ar.ayahPlayerLabelWithSurah(surahName, ayahNumber)
    : ar.ayahPlayerLabel(ayahNumber);

  const onSlidingStart = useCallback(() => {
    setSeeking(true);
    setSeekValue(positionMillis);
  }, [positionMillis]);

  const onValueChange = useCallback((value: number) => {
    setSeekValue(value);
  }, []);

  const onSlidingComplete = useCallback(
    (value: number) => {
      setSeeking(false);
      onSeek(value);
    },
    [onSeek]
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: c.surface,
          shadowColor: isDark ? '#000' : c.cardShadow,
        },
      ]}
    >
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={18}
          onPress={onClose}
          iconColor={c.textSecondary}
          accessibilityLabel={ar.audioPlayerCloseA11y}
          style={styles.closeButton}
        />
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.sliderWrap}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maxDuration}
          value={sliderValue}
          onSlidingStart={onSlidingStart}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          minimumTrackTintColor={c.accent}
          maximumTrackTintColor={isDark ? '#455A64' : '#DDE4E0'}
          thumbTintColor={c.accent}
          accessibilityLabel={ar.audioPlayerSeekA11y}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: c.textSecondary }]}>
            {formatMillis(sliderValue)}
          </Text>
          <Text style={[styles.time, { color: c.textSecondary }]}>
            {formatMillis(durationMillis)}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <ControlButton
          icon={repeatEnabled ? 'repeat' : 'repeat-off'}
          active={repeatEnabled}
          onPress={onToggleRepeat}
          accessibilityLabel={ar.audioPlayerRepeatA11y}
          accent={c.accent}
          muted={c.textSecondary}
          isDark={isDark}
        />
        {isLoading ? (
          <View style={styles.playWrap}>
            <ActivityIndicator color={c.accent} />
          </View>
        ) : (
          <Pressable
            onPress={onTogglePlayPause}
            accessibilityRole="button"
            accessibilityLabel={
              isPlaying ? ar.audioPlayerPauseA11y : ar.audioPlayerPlayA11y
            }
            style={({ pressed }) => [
              styles.playWrap,
              { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <IconButton
              icon={isPlaying ? 'pause' : 'play'}
              size={28}
              iconColor="#fff"
              onPress={onTogglePlayPause}
              style={styles.playIcon}
            />
          </Pressable>
        )}
        <ControlButton
          icon={autoNextEnabled ? 'skip-next' : 'skip-next-outline'}
          active={autoNextEnabled}
          onPress={onToggleAutoNext}
          accessibilityLabel={ar.audioPlayerAutoNextA11y}
          accent={c.accent}
          muted={c.textSecondary}
          isDark={isDark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: sp.lg,
    paddingTop: sp.sm,
    paddingBottom: sp.md,
    gap: 2,
    elevation: 12,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    minHeight: 32,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  closeButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  headerSpacer: {
    width: 32,
  },
  sliderWrap: {
    gap: 0,
  },
  slider: {
    width: '100%',
    height: 28,
    marginHorizontal: -2,
  },
  timeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 2,
  },
  time: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.lg,
    marginTop: sp.xs,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    margin: 0,
    width: 40,
    height: 40,
  },
  playWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    margin: 0,
    width: 52,
    height: 52,
  },
});
