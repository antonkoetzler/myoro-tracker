import AsyncStorage from '@react-native-async-storage/async-storage';
import * as database from './database';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = '@myoro_tracker_theme';

export async function getThemePreference(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (
      stored &&
      (stored === 'light' || stored === 'dark' || stored === 'system')
    ) {
      return stored;
    }
  } catch (error) {
    console.error('Error reading theme preference:', error);
  }
  return 'system';
}

export async function setThemePreference(theme: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
}

export function cycleTheme(currentTheme: ThemeMode): ThemeMode {
  const cycle: ThemeMode[] = ['light', 'dark', 'system'];
  const currentIndex = cycle.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % cycle.length;
  return cycle[nextIndex];
}
