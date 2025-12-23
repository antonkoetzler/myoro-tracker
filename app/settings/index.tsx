import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Input,
} from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import { syncToCloud, syncFromCloud, deleteCloudData } from '../../lib/sync';
import i18n from '../../lib/i18n';
import { formatCurrency } from '../../lib/currency';

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
  const insets = useSafeAreaInsets();
  const toast = useToastController();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [languageSearch, setLanguageSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!languageSearch.trim()) return LANGUAGES;
    const search = languageSearch.toLowerCase();
    return LANGUAGES.filter(
      (lang) =>
        lang.label.toLowerCase().includes(search) ||
        lang.value.toLowerCase().includes(search),
    );
  }, [languageSearch]);

  useEffect(() => {
    database.initDatabase();
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
        await database.updateUserPreferences(user?.id || null, {
          cloud_enabled: true,
        });
        await syncToCloud(user?.id || null);
        await syncFromCloud(user?.id || null);
        setCloudEnabled(true);
        toast.show('Cloud storage enabled', {
          message: 'Your trackers are now syncing to the cloud',
        });
      } else {
        const shouldOffload = confirm(t('screens.settings.offloadData'));
        await database.updateUserPreferences(user?.id || null, {
          cloud_enabled: false,
        });
        await deleteCloudData(user?.id || null);
        setCloudEnabled(false);
        toast.show('Cloud storage disabled', {
          message: shouldOffload
            ? 'Data offloaded to device'
            : 'Cloud data deleted',
        });
      }
    } catch (error) {
      console.error('Error toggling cloud:', error);
      toast.show('Error', {
        message: 'Failed to update cloud storage settings',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    toast.show('Language changed', {
      message: `Language set to ${LANGUAGES.find((l) => l.value === lang)?.label || lang}`,
    });
  };

  const handlePremiumSubscribe = () => {
    toast.show('Coming soon', {
      message: 'Premium subscription will be available soon',
    });
  };

  const premiumPrice = formatCurrency(3);

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
        pt={insets.top}
        pb="$4"
        px="$4"
        items="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        bg="$background"
      >
        <Button
          size="$3"
          circular
          icon={ArrowLeft}
          onPress={() => router.back()}
        />
        <Text fontSize="$6" fontWeight="bold" flex={1}>
          {t('screens.settings.title')}
        </Text>
      </XStack>

      <ScrollView flex={1} p="$4">
        <YStack gap="$4">
          <Card p="$4">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                {t('screens.settings.account')}
              </Text>
              <Separator />
              {userId ? (
                <YStack gap="$2">
                  <Text fontSize="$3" opacity={0.7}>
                    {t('screens.settings.account')}
                  </Text>
                  <Text fontSize="$4">{userEmail || userId}</Text>
                </YStack>
              ) : (
                <Text fontSize="$4" opacity={0.7}>
                  Not signed in
                </Text>
              )}
            </YStack>
          </Card>

          <Card p="$4">
            <YStack gap="$3">
              <XStack justify="space-between" items="center">
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="bold">
                    {t('screens.settings.cloudStorage')}
                  </Text>
                  <Text fontSize="$3" opacity={0.7}>
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
                <Text fontSize="$2" opacity={0.7}>
                  {t('screens.details.premiumRequired')}
                </Text>
              )}
              {syncing && <Spinner size="small" />}
            </YStack>
          </Card>

          <Card p="$4">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                {t('screens.settings.premium')}
              </Text>
              <Separator />
              <Text fontSize="$4">
                {t('screens.settings.premiumDescription')}
              </Text>
              {!premium && (
                <Button onPress={handlePremiumSubscribe}>
                  <Text>Subscribe for {premiumPrice}/month</Text>
                </Button>
              )}
              {premium && (
                <Text fontSize="$4" color="$green10">
                  Premium Active
                </Text>
              )}
            </YStack>
          </Card>

          <Card p="$4">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                {t('screens.settings.theme')}
              </Text>
              <Separator />
              <Text fontSize="$4">
                {colorScheme === 'dark' ? t('common.dark') : t('common.light')}
              </Text>
              <Text fontSize="$3" opacity={0.7}>
                Theme is controlled by system settings
              </Text>
            </YStack>
          </Card>

          <Card p="$4">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                {t('screens.settings.language')}
              </Text>
              <Separator />
              <Input
                placeholder="Search languages..."
                value={languageSearch}
                onChangeText={setLanguageSearch}
                mb="$2"
              />
              <Select
                value={currentLanguage}
                onValueChange={handleLanguageChange}
              >
                <Select.Trigger width="100%">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {filteredLanguages.map((lang, index) => (
                      <Select.Item
                        key={lang.value}
                        value={lang.value}
                        index={index}
                      >
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
    </YStack>
  );
}
