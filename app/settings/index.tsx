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
  Switch,
  Select,
  Spinner,
} from 'tamagui';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import { syncToCloud, syncFromCloud, deleteCloudData } from '../../lib/sync';
import { initDatabase } from '../../lib/database';
import i18n from '../../lib/i18n';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'pl', label: 'Polski' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    initDatabase();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setUserEmail(user?.email || null);

      if (user) {
        const prefs = await database.getUserPreferences(user.id);
        setCloudEnabled(prefs.cloud_enabled);
        setPremium(prefs.premium_active);
      } else {
        const prefs = await database.getUserPreferences(null);
        setCloudEnabled(prefs.cloud_enabled);
        setPremium(prefs.premium_active);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloudToggle = async (enabled: boolean) => {
    try {
      setSyncing(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (enabled) {
        // Enable cloud - sync local to cloud
        await database.updateUserPreferences(user?.id || null, {
          cloud_enabled: true,
        });
        await syncToCloud(user?.id || null);
        await syncFromCloud(user?.id || null);
        setCloudEnabled(true);
      } else {
        // Disable cloud - prompt user
        const shouldOffload = confirm(t('screens.settings.offloadData'));
        if (shouldOffload) {
          // Data is already local, just disable
          await database.updateUserPreferences(user?.id || null, {
            cloud_enabled: false,
          });
          await deleteCloudData(user?.id || null);
        } else {
          // User chose to delete cloud data
          await database.updateUserPreferences(user?.id || null, {
            cloud_enabled: false,
          });
          await deleteCloudData(user?.id || null);
        }
        setCloudEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling cloud:', error);
      alert('Failed to update cloud storage settings');
    } finally {
      setSyncing(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
  };

  const handlePremiumSubscribe = () => {
    // This will be handled by native in-app purchase later
    alert('Premium subscription will be available soon');
  };

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <ScrollView flex={1} padding="$4">
      <YStack gap="$4">
        <Card padding="$4">
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">
              {t('screens.settings.account')}
            </Text>
            <Separator />
            {userId ? (
              <YStack gap="$2">
                <Text fontSize="$3" color="$colorSubtitle">
                  {t('screens.settings.account')}
                </Text>
                <Text fontSize="$4">{userEmail || userId}</Text>
              </YStack>
            ) : (
              <Text fontSize="$4" color="$colorSubtitle">
                Not signed in
              </Text>
            )}
          </YStack>
        </Card>

        <Card padding="$4">
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="bold">
                  {t('screens.settings.cloudStorage')}
                </Text>
                <Text fontSize="$3" color="$colorSubtitle">
                  {t('screens.settings.cloudStorageDescription')}
                </Text>
              </YStack>
              <Switch
                checked={cloudEnabled}
                onCheckedChange={handleCloudToggle}
                disabled={syncing || !premium}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </XStack>
            {!premium && (
              <Text fontSize="$2" color="$colorSubtitle">
                {t('screens.details.premiumRequired')}
              </Text>
            )}
            {syncing && <Spinner size="small" />}
          </YStack>
        </Card>

        <Card padding="$4">
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">
              {t('screens.settings.premium')}
            </Text>
            <Separator />
            <Text fontSize="$4">{t('screens.settings.premiumDescription')}</Text>
            {!premium && (
              <Button onPress={handlePremiumSubscribe}>
                <Text>{t('screens.settings.subscribe')}</Text>
              </Button>
            )}
            {premium && (
              <Text fontSize="$4" color="$green10">
                Premium Active
              </Text>
            )}
          </YStack>
        </Card>

        <Card padding="$4">
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">
              {t('screens.settings.theme')}
            </Text>
            <Separator />
            <Text fontSize="$4">
              {colorScheme === 'dark' ? t('common.dark') : t('common.light')}
            </Text>
            <Text fontSize="$3" color="$colorSubtitle">
              Theme is controlled by system settings
            </Text>
          </YStack>
        </Card>

        <Card padding="$4">
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">
              {t('screens.settings.language')}
            </Text>
            <Separator />
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <Select.Trigger width="100%">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {LANGUAGES.map((lang) => (
                    <Select.Item key={lang.value} value={lang.value}>
                      <Select.ItemText>{lang.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}

