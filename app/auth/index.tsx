import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, Button, Text, Spinner, XStack } from 'tamagui';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { GoogleIcon, AppleIcon, GitHubIcon } from '../../components/OAuthIcons';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple' | 'github') => {
    try {
      setLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'myapp://auth/callback',
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('OAuth error:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleContinueWithoutSignIn = () => {
    router.replace('/home' as Href);
  };

  return (
    <YStack
      flex={1}
      items="center"
      justify="center"
      pt={insets.top}
      pb={insets.bottom}
      px="$4"
      gap="$4"
    >
      <Text fontSize="$8" fontWeight="bold" mb="$4">
        {t('screens.auth.title')}
      </Text>

      <Button
        size="$4"
        width="100%"
        onPress={() => handleOAuth('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? (
          <Spinner />
        ) : (
          <XStack items="center" gap="$2">
            <GoogleIcon size={20} />
            <Text>{t('screens.auth.signInWithGoogle')}</Text>
          </XStack>
        )}
      </Button>

      <Button
        size="$4"
        width="100%"
        onPress={() => handleOAuth('apple')}
        disabled={loading !== null}
      >
        {loading === 'apple' ? (
          <Spinner />
        ) : (
          <XStack items="center" gap="$2">
            <AppleIcon size={20} />
            <Text>{t('screens.auth.signInWithApple')}</Text>
          </XStack>
        )}
      </Button>

      <Button
        size="$4"
        width="100%"
        onPress={() => handleOAuth('github')}
        disabled={loading !== null}
      >
        {loading === 'github' ? (
          <Spinner />
        ) : (
          <XStack items="center" gap="$2">
            <GitHubIcon size={20} />
            <Text>{t('screens.auth.signInWithGitHub')}</Text>
          </XStack>
        )}
      </Button>

      <Button
        size="$4"
        width="100%"
        variant="outlined"
        onPress={handleContinueWithoutSignIn}
        disabled={loading !== null}
      >
        <Text>{t('screens.auth.continueWithoutSignIn')}</Text>
      </Button>
    </YStack>
  );
}
