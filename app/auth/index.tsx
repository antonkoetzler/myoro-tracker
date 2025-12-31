import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Keyboard } from 'react-native';
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

const extractErrorMessage = (
  error: unknown,
  t: (key: string) => string,
): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    // Extract user-friendly message from Supabase errors
    if (message.includes('Invalid login credentials')) {
      return t('errors.invalidCredentials');
    }
    if (message.includes('Email not confirmed')) {
      return t('errors.emailNotConfirmed');
    }
    if (message.includes('User already registered')) {
      return t('errors.userAlreadyRegistered');
    }
    // Return the message as-is if it's already user-friendly
    return message;
  }
  return t('errors.generic');
};

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToastController();
  const [loading, setLoading] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordInputRef = useRef<{ focus: () => void } | null>(null);

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
      toast.show(t('errors.authentication'), {
        message: extractErrorMessage(error, t),
      });
      setLoading(null);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      toast.show(t('errors.validation'), {
        message: t('validation.enterEmailAndPassword'),
      });
      return;
    }

    if (password.length < 6) {
      toast.show(t('errors.validation'), {
        message: t('validation.passwordMinLength'),
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

        if (error) {
          const errorMessage = extractErrorMessage(error, t);
          toast.show(t('errors.authentication'), {
            message: errorMessage,
          });
          setLoading(null);
          return;
        }

        toast.show(t('messages.accountCreated'), {
          message: t('messages.checkEmail'),
        });
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setLoading(null);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          const errorMessage = extractErrorMessage(error, t);
          toast.show(t('errors.authentication'), {
            message: errorMessage,
          });
          setLoading(null);
          return;
        }

        toast.show(t('messages.signedIn'), {
          message: t('messages.welcomeBack'),
        });
        router.replace('/home' as Href);
        setLoading(null);
      }
    } catch (error) {
      console.error('Email auth error:', error);
      const errorMessage = extractErrorMessage(error, t);
      toast.show(t('errors.authentication'), {
        message: errorMessage,
      });
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
      gap="$3"
      bg="$background"
    >
      <Text fontSize="$8" fontWeight="bold" mb="$4" color="$color">
        {t('screens.auth.title')}
      </Text>

      <YStack width="100%" gap="$3" mb="$2">
        <Input
          placeholder={t('placeholders.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={loading === null}
          returnKeyType="next"
          onSubmitEditing={() => {
            passwordInputRef.current?.focus();
          }}
        />
        <Input
          ref={passwordInputRef}
          placeholder={t('placeholders.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'password-new' : 'password'}
          editable={loading === null}
          returnKeyType="done"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            if (email.trim() && password.trim()) {
              handleEmailAuth();
            }
          }}
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
            <Text>{isSignUp ? t('buttons.signUp') : t('buttons.signIn')}</Text>
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
              ? t('buttons.alreadyHaveAccount')
              : t('buttons.dontHaveAccount')}
          </Text>
        </Button>
      </YStack>

      <XStack items="center" gap="$3" width="100%" my="$2">
        <Separator flex={1} />
        <Text fontSize="$3" opacity={0.7}>
          {t('common.or')}
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
            <YStack color="$color">
              <GitHubIcon size={20} />
            </YStack>
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
