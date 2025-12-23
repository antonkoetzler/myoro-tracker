import '../tamagui-web.css';
import '../tamagui.config';
import '../lib/i18n';

import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { Provider } from 'components/Provider';
import { supabase } from '../lib/supabase';
import * as database from '../lib/database';
import {
  syncToCloud,
  syncFromCloud,
  setupRealtimeListeners,
} from '../lib/sync';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'home',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * RootLayout component for the app.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [interLoaded, interError] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });
  const [userId, setUserId] = useState<string | null>(null);

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    database.initDatabase();
    checkAuth();
    setupAuthListener();
  }, []);

  useEffect(() => {
    if (userId) {
      initializeSync();
    }
  }, [userId]);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
  };

  const initializeSync = async () => {
    try {
      const prefs = await database.getUserPreferences(userId);
      if (prefs.cloud_enabled) {
        await syncToCloud(userId);
        await syncFromCloud(userId);
        setupRealtimeListeners(userId, () => {
          // Refresh data when sync updates occur
        });
      }
    } catch (error) {
      console.error('Error initializing sync:', error);
    }
  };

  useEffect(() => {
    if (interLoaded || interError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync();
    }
  }, [interLoaded, interError]);

  return !interLoaded && !interError ? null : (
    <Provider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="home"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
}
