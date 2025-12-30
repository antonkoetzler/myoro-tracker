import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  YStack,
  Button,
  Text,
  Spinner,
  XStack,
  Input,
  Separator,
} from 'tamagui';
import { useToastController } from '@tamagui/toast';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { GoogleIcon, GitHubIcon } from '../../components/OAuthIcons';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToastController();
  const [loading, setLoading] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleOAuth = async (provider: 'google' | 'github') => {
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
      toast.show('Authentication error', {
        message: error instanceof Error ? error.message : 'Failed to sign in',
      });
      setLoading(null);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      toast.show('Validation error', {
        message: 'Please enter both email and password',
      });
      return;
    }

    if (password.length < 6) {
      toast.show('Validation error', {
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    try {
      setLoading('email');
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        toast.show('Account created', {
          message: 'Please check your email to verify your account',
        });
        setIsSignUp(false);
        setEmail('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        toast.show('Signed in', {
          message: 'Welcome back!',
        });
        router.replace('/home' as Href);
      }
    } catch (error) {
      console.error('Email auth error:', error);
      toast.show('Authentication error', {
        message: error instanceof Error ? error.message : 'Failed to authenticate',
      });
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

      <YStack width="100%" gap="$3" mb="$2">
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={loading === null}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'password-new' : 'password'}
          editable={loading === null}
        />
        <Button
          size="$4"
          width="100%"
          onPress={handleEmailAuth}
          disabled={loading !== null}
        >
          {loading === 'email' ? (
            <Spinner />
          ) : (
            <Text>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
          )}
        </Button>
        <Button
          size="$3"
          variant="outlined"
          onPress={() => {
            setIsSignUp(!isSignUp);
            setEmail('');
            setPassword('');
          }}
          disabled={loading !== null}
        >
          <Text fontSize="$3">
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </Button>
      </YStack>

      <XStack items="center" gap="$3" width="100%" my="$2">
        <Separator flex={1} />
        <Text fontSize="$3" opacity={0.7}>
          OR
        </Text>
        <Separator flex={1} />
      </XStack>

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
