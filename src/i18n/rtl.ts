import { DevSettings, I18nManager, Platform } from 'react-native';

export function getTextDirection(): 'rtl' {
  return 'rtl';
}

export function configureRtlLayout(): boolean {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
    return false;
  }

  if (I18nManager.isRTL) return false;

  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  return true;
}

export function reloadAppForRtl(): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  DevSettings.reload();
}
