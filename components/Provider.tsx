import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { CurrentToast } from './CurrentToast';
import { config } from '../tamagui.config';
import { getThemePreference, type ThemeMode } from '../lib/theme';

/**
 * Provider component for the app.
 */
export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const theme = await getThemePreference();
      setThemeMode(theme);
      setIsLoading(false);
    };
    loadTheme();

    // Listen for theme changes by polling (simple approach)
    const interval = setInterval(async () => {
      const theme = await getThemePreference();
      setThemeMode((prev) => {
        if (prev !== theme) {
          return theme;
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getActiveTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  if (isLoading) {
    // Use system theme while loading
    return (
      <TamaguiProvider
        config={config}
        defaultTheme={systemColorScheme === 'dark' ? 'dark' : 'light'}
        {...rest}
      >
        {children}
      </TamaguiProvider>
    );
  }

  const activeTheme = getActiveTheme();

  return (
    <TamaguiProvider
      key={activeTheme}
      config={config}
      defaultTheme={activeTheme}
      {...rest}
    >
      <ToastProvider
        swipeDirection="horizontal"
        duration={6000}
        native={
          [
            // uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go
            // 'mobile'
          ]
        }
      >
        {children}
        <CurrentToast />
        <ToastViewport bottom="$4" left={0} right={0} />
      </ToastProvider>
    </TamaguiProvider>
  );
}
