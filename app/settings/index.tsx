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
  Select,
  Spinner,
  Input,
} from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import { syncUserPreferencesFromCloud } from '../../lib/sync';
import i18n from '../../lib/i18n';
import { formatCurrency } from '../../lib/currency';
import { purchasePremium, restorePurchases } from '../../lib/purchases';
import { checkPremiumStatus, syncPremiumFromCloud } from '../../lib/premium';

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
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
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
        await syncPremiumFromCloud(user.id);
        await syncUserPreferencesFromCloud(user.id);
        const isPremium = await checkPremiumStatus(user.id);
        setPremium(isPremium);
      } else {
        const prefs = await database.getUserPreferences(null);
        setPremium(prefs.premium_active);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    toast.show(t('messages.languageChanged'), {
      message: `${t('messages.languageSetTo')} ${LANGUAGES.find((l) => l.value === lang)?.label || lang}`,
    });
  };

  const handlePremiumSubscribe = async () => {
    if (purchasing) return;

    try {
      setPurchasing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.show(t('messages.signInRequired'), {
          message: t('messages.pleaseSignInToPurchasePremium'),
        });
        return;
      }

      const result = await purchasePremium();

      if (result.success) {
        await syncPremiumFromCloud(user.id);
        const isPremium = await checkPremiumStatus(user.id);
        setPremium(isPremium);
        toast.show(t('messages.premiumActivated'), {
          message: t('messages.thankYouForSubscribing'),
        });
      } else {
        toast.show(t('messages.purchaseFailed'), {
          message: result.error || t('errors.failedToCompletePurchase'),
        });
      }
    } catch (error) {
      console.error('Error purchasing premium:', error);
      toast.show(t('messages.error'), {
        message: t('messages.anErrorOccurredDuringPurchase'),
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (restoring) return;

    try {
      setRestoring(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.show(t('messages.signInRequired'), {
          message: t('messages.pleaseSignInToRestorePurchases'),
        });
        return;
      }

      const result = await restorePurchases();

      if (result.success) {
        if (result.restored) {
          await syncPremiumFromCloud(user.id);
          const isPremium = await checkPremiumStatus(user.id);
          setPremium(isPremium);
          toast.show(t('messages.purchasesRestored'), {
            message: t('messages.yourPremiumSubscriptionHasBeenRestored'),
          });
        } else {
          toast.show(t('messages.noPurchasesFound'), {
            message: t('messages.noPreviousPurchasesWereFoundToRestore'),
          });
        }
      } else {
        toast.show(t('messages.restoreFailed'), {
          message: result.error || t('errors.failedToRestorePurchases'),
        });
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast.show(t('messages.error'), {
        message: t('messages.anErrorOccurredWhileRestoringPurchases'),
      });
    } finally {
      setRestoring(false);
    }
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
              <Text fontSize="$5" fontWeight="bold">
                {t('screens.settings.premium')}
              </Text>
              <Separator />
              <Text fontSize="$4">
                {t('screens.settings.premiumDescription')}
              </Text>
              {!premium && (
                <YStack gap="$3">
                  <Button
                    onPress={handlePremiumSubscribe}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <Spinner />
                    ) : (
                      <Text>Subscribe for {premiumPrice}/month</Text>
                    )}
                  </Button>
                  <Button
                    onPress={handleRestorePurchases}
                    disabled={restoring}
                    variant="outlined"
                  >
                    {restoring ? (
                      <Spinner />
                    ) : (
                      <Text>{t('buttons.restorePurchases')}</Text>
                    )}
                  </Button>
                </YStack>
              )}
              {premium && (
                <YStack gap="$2">
                  <Text fontSize="$4" color="$green10">
                    Premium Active
                  </Text>
                  <Button
                    onPress={handleRestorePurchases}
                    disabled={restoring}
                    variant="outlined"
                    size="$3"
                  >
                    {restoring ? (
                      <Spinner />
                    ) : (
                      <Text>{t('buttons.restorePurchases')}</Text>
                    )}
                  </Button>
                </YStack>
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
