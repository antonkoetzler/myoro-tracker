import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack, Button, Text, Spinner } from 'tamagui';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple' | 'github') => {
    try {
      setLoading(provider);
      const { data, error } = await supabase.auth.signInWithOAuth({
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
    router.replace('/home');
  };

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
      <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
        {t('screens.auth.title')}
      </Text>

      <Button
        size="$4"
        width="100%"
        onPress={() => handleOAuth('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? <Spinner /> : <Text>{t('screens.auth.signInWithGoogle')}</Text>}
      </Button>

      <Button
        size="$4"
        width="100%"
        onPress={() => handleOAuth('apple')}
        disabled={loading !== null}
      >
        {loading === 'apple' ? <Spinner /> : <Text>{t('screens.auth.signInWithApple')}</Text>}
      </Button>

      <Button
        size="$4"
        width="100%"
        onPress={() => handleOAuth('github')}
        disabled={loading !== null}
      >
        {loading === 'github' ? <Spinner /> : <Text>{t('screens.auth.signInWithGitHub')}</Text>}
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

