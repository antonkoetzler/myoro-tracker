import { useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  YStack,
  XStack,
  Button,
  Text,
  ScrollView,
  Card,
  Spinner,
} from 'tamagui';
import {
  MoreVertical,
  Plus,
  Moon,
  Sun,
  LogOut,
  Settings,
  Monitor,
} from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import { Pressable } from 'react-native';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import type { Tracker } from '../../lib/types';
import {
  getThemePreference,
  setThemePreference,
  cycleTheme,
} from '../../lib/theme';
import type { ThemeMode } from '../../lib/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToastController();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);
  const [trackerCount, setTrackerCount] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    database.initDatabase();
    loadTrackers();
    checkAuth();
    loadTheme();
  }, []);

  useFocusEffect(() => {
    loadTrackers();
  });

  const loadTheme = async () => {
    const theme = await getThemePreference();
    setThemeMode(theme);
  };

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const prefs = await database.getUserPreferences(user?.id || null);
    setPremium(prefs.premium_active);

    const count = await database.getTrackerCount(user?.id || null);
    setTrackerCount(count);
  };

  const loadTrackers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userTrackers = await database.getAllTrackers(user?.id || null);
      setTrackers(userTrackers);
    } catch (error) {
      console.error('Error loading trackers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTracker = async () => {
    if (!premium && trackerCount >= 10) {
      toast.show(t('screens.home.trackerLimit'), {
        message: t('screens.home.freeLimit'),
      });
      return;
    }
    router.push('/home/create' as Href);
  };

  const handleTrackerPress = (id: string) => {
    router.push(`/home/${id}` as Href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setShowMenu(false);
    toast.show('Logged out', { message: 'You have been logged out' });
    router.replace('/auth' as Href);
  };

  const handleThemeToggle = async () => {
    const newTheme = cycleTheme(themeMode);
    await setThemePreference(newTheme);
    setThemeMode(newTheme);
    setShowMenu(false);
    toast.show('Theme changed', {
      message: `Theme set to ${newTheme === 'system' ? 'system default' : newTheme}`,
    });
    // Note: Actual theme change requires app restart or context update
  };

  const getThemeLabel = () => {
    if (themeMode === 'system') return 'System';
    return themeMode === 'dark' ? 'Dark' : 'Light';
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return Monitor;
    return themeMode === 'dark' ? Moon : Sun;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <Pressable style={{ flex: 1 }} onPress={() => setShowMenu(false)}>
        <YStack flex={1}>
          <XStack
            pt={insets.top + 16}
            pb="$4"
            px="$4"
            justify="space-between"
            items="center"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            bg="$background"
          >
            <Text fontSize="$6" fontWeight="bold">
              {t('app.name')}
            </Text>
            <XStack gap="$2">
              <Button
                size="$3"
                circular
                icon={Plus}
                onPress={handleCreateTracker}
              />
              <Button
                size="$3"
                circular
                icon={MoreVertical}
                onPress={() => setShowMenu(!showMenu)}
              />
            </XStack>
          </XStack>

          {showMenu && (
            <YStack
              position="absolute"
              style={{
                top: insets.top + 60,
                right: 16,
                zIndex: 1000,
                minWidth: 200,
              }}
              bg="$background"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              p="$3"
              gap="$2"
              elevation={5}
            >
              <Button
                icon={getThemeIcon()}
                onPress={handleThemeToggle}
                size="$3"
              >
                Change to {getThemeLabel()}
              </Button>
              <Button
                icon={Settings}
                onPress={() => {
                  router.push('/settings' as Href);
                  setShowMenu(false);
                }}
                size="$3"
              >
                {t('screens.settings.title')}
              </Button>
              {userId ? (
                <Button
                  icon={LogOut}
                  onPress={handleLogout}
                  variant="outlined"
                  size="$3"
                >
                  {t('common.logout')}
                </Button>
              ) : (
                <Button
                  onPress={() => {
                    router.push('/auth' as Href);
                    setShowMenu(false);
                  }}
                  variant="outlined"
                  size="$3"
                >
                  {t('screens.auth.title')}
                </Button>
              )}
            </YStack>
          )}

          <ScrollView flex={1} p="$4">
            {!premium && trackerCount >= 10 && (
              <YStack p="$4" bg="$yellow2" rounded="$4" mb="$4">
                <Text fontSize="$4" color="$yellow11">
                  {t('screens.home.trackerLimit')}
                </Text>
                <Text fontSize="$3" color="$yellow11" mt="$2">
                  {t('screens.home.freeLimit')}
                </Text>
              </YStack>
            )}
            {trackers.length === 0 ? (
              <YStack items="center" justify="center" p="$8" gap="$4">
                <Text fontSize="$5" color="$color">
                  {t('screens.home.noTrackers')}
                </Text>
                <Button
                  onPress={handleCreateTracker}
                  disabled={!premium && trackerCount >= 10}
                >
                  {t('screens.home.createTracker')}
                </Button>
              </YStack>
            ) : (
              <YStack gap="$3">
                {trackers.map((tracker) => (
                  <Card
                    key={tracker.id}
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => handleTrackerPress(tracker.id)}
                    p="$4"
                  >
                    <XStack gap="$3" items="center">
                      <YStack
                        width={4}
                        height="100%"
                        bg={(tracker.color || '#3B82F6') as `#${string}`}
                        rounded="$2"
                      />
                      <YStack gap="$2" flex={1}>
                        <Text fontSize="$5" fontWeight="bold">
                          {tracker.name}
                        </Text>
                        {tracker.description && (
                          <Text fontSize="$3" opacity={0.7}>
                            {tracker.description}
                          </Text>
                        )}
                        <Text fontSize="$2" opacity={0.7}>
                          {t('screens.details.timeSinceRestart')}:{' '}
                          {formatTime(tracker.last_restart_at)}
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                ))}
              </YStack>
            )}
          </ScrollView>
        </YStack>
      </Pressable>
    </YStack>
  );
}
