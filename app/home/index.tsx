import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
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
} from '@tamagui/lucide-icons';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import type { Tracker } from '../../lib/types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
    router.push('/home/create' as Href);
  };

  const handleTrackerPress = (id: string) => {
    router.push(`/home/${id}` as Href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    router.replace('/auth' as Href);
  };

  const toggleTheme = () => {
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
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <XStack
        p="$4"
        justify="space-between"
        items="center"
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
          bg="$background"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          p="$3"
          gap="$2"
          mx="$4"
          mt="$2"
        >
          <Button
            icon={colorScheme === 'dark' ? Sun : Moon}
            onPress={toggleTheme}
            size="$3"
          >
            {colorScheme === 'dark' ? t('common.light') : t('common.dark')}
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
          {userId && (
            <Button
              icon={LogOut}
              onPress={handleLogout}
              variant="outlined"
              size="$3"
            >
              {t('common.logout')}
            </Button>
          )}
          {!userId && (
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
                <YStack gap="$2">
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
              </Card>
            ))}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
