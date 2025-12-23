import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import {
  YStack,
  XStack,
  Button,
  Text,
  ScrollView,
  Card,
  Separator,
  Sheet,
  Adapt,
  Select,
  Spinner,
} from 'tamagui';
import { useTheme } from 'tamagui';
import { MoreVertical, Plus, Moon, Sun, LogOut, Settings } from '@tamagui/lucide-icons';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import type { Tracker } from '../../lib/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);
  const [trackerCount, setTrackerCount] = useState(0);

  useEffect(() => {
    database.initDatabase();
    loadTrackers();
    checkAuth();
  }, []);

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
      alert(t('screens.home.trackerLimit'));
      return;
    }
    router.push('/home/create');
  };

  const handleTrackerPress = (id: string) => {
    router.push(`/home/${id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    router.replace('/auth');
  };

  const toggleTheme = () => {
    // Theme toggle will be handled by the root layout
    setShowMenu(false);
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
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
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
          <Sheet open={showMenu} onOpenChange={setShowMenu} modal snapPoints={[35]}>
            <Sheet.Trigger asChild>
              <Button size="$3" circular icon={MoreVertical} />
            </Sheet.Trigger>
            <Adapt when="sm" platform="touch">
              <Sheet.Sheet modal dismissOnSnapToBottom>
                <Sheet.Frame padding="$4" gap="$4">
                  <Button
                    icon={colorScheme === 'dark' ? Sun : Moon}
                    onPress={toggleTheme}
                  >
                    {colorScheme === 'dark' ? t('common.light') : t('common.dark')}
                  </Button>
                  <Button icon={Settings} onPress={() => router.push('/settings')}>
                    {t('screens.settings.title')}
                  </Button>
                  {userId && (
                    <Button icon={LogOut} onPress={handleLogout} variant="outlined">
                      {t('common.logout')}
                    </Button>
                  )}
                  {!userId && (
                    <Button onPress={() => router.push('/auth')} variant="outlined">
                      {t('screens.auth.title')}
                    </Button>
                  )}
                </Sheet.Frame>
              </Sheet.Sheet>
            </Adapt>
          </Sheet>
        </XStack>
      </XStack>

      <ScrollView flex={1} padding="$4">
        {!premium && trackerCount >= 10 && (
          <YStack padding="$4" backgroundColor="$yellow2" borderRadius="$4" marginBottom="$4">
            <Text fontSize="$4" color="$yellow11">
              {t('screens.home.trackerLimit')}
            </Text>
            <Text fontSize="$3" color="$yellow11" marginTop="$2">
              {t('screens.home.freeLimit')}
            </Text>
          </YStack>
        )}
        {trackers.length === 0 ? (
          <YStack alignItems="center" justifyContent="center" padding="$8" gap="$4">
            <Text fontSize="$5" color="$color">
              {t('screens.home.noTrackers')}
            </Text>
            <Button onPress={handleCreateTracker} disabled={!premium && trackerCount >= 10}>
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
                padding="$4"
              >
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="bold">
                    {tracker.name}
                  </Text>
                  {tracker.description && (
                    <Text fontSize="$3" color="$colorSubtitle">
                      {tracker.description}
                    </Text>
                  )}
                  <Text fontSize="$2" color="$colorSubtitle">
                    {t('screens.details.timeSinceRestart')}: {formatTime(tracker.last_restart_at)}
                  </Text>
                </YStack>
              </Card>
            ))}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}

