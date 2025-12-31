import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  YStack,
  Button,
  Text,
  Input,
  TextArea,
  Spinner,
  XStack,
} from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { useToastController } from '@tamagui/toast';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import { syncToCloud } from '../../lib/sync';
import { ColorPicker } from '../../components/ColorPicker';

export default function CreateTrackerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToastController();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<Input>(null);

  useEffect(() => {
    // Focus the name input when the screen loads
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.show(t('messages.error'), {
        message: t('validation.nameRequired'),
      });
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const prefs = await database.getUserPreferences(user?.id || null);
      const count = await database.getTrackerCount(user?.id || null);

      if (!prefs.premium_active && count >= 10) {
        toast.show(t('screens.home.trackerLimit'), {
          message: t('screens.home.freeLimit'),
        });
        return;
      }

      const userId = user?.id || null;
      await database.createTracker({
        user_id: userId,
        name: name.trim(),
        description: description.trim(),
        color,
        created_at: new Date().toISOString(),
        last_restart_at: new Date().toISOString(),
        restart_count: 0,
      });

      // Sync to cloud if user is logged in
      if (user?.id) {
        try {
          await syncToCloud(user.id);
        } catch (error) {
          console.error('Error syncing to cloud:', error);
        }
      }

      toast.show(t('messages.success'), {
        message: t('messages.trackerCreatedSuccessfully'),
      });
      router.back();
    } catch (error) {
      console.error('Error creating tracker:', error);
      toast.show(t('messages.error'), {
        message: t('errors.failedToCreateTracker'),
      });
    } finally {
      setLoading(false);
    }
  };

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
          {t('screens.home.createTracker')}
        </Text>
      </XStack>

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <YStack flex={1} p="$4" gap="$4">
          <YStack gap="$3" flex={1}>
            <YStack gap="$2">
              <Text>{t('screens.details.name')}</Text>
              <XStack gap="$2" items="center">
                <Button
                  size="$4"
                  circular
                  bg={color as `#${string}`}
                  borderWidth={2}
                  borderColor="$borderColor"
                  onPress={() => setShowColorPicker(true)}
                  pressStyle={{ scale: 0.9 }}
                />
                <Input
                  ref={nameInputRef}
                  flex={1}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('screens.details.name')}
                  borderColor={!name.trim() ? '$red8' : '$borderColor'}
                />
              </XStack>
              {!name.trim() && (
                <Text fontSize="$2" color="$red10">
                  {t('validation.nameRequired')}
                </Text>
              )}
            </YStack>

            <YStack gap="$2" flex={1}>
              <Text>{t('screens.details.description')}</Text>
              <TextArea
                flex={1}
                value={description}
                onChangeText={setDescription}
                placeholder={t('screens.details.description')}
                height={100}
              />
            </YStack>
          </YStack>

          <Button onPress={handleCreate} disabled={loading || !name.trim()}>
            {loading ? <Spinner /> : <Text>{t('common.save')}</Text>}
          </Button>
        </YStack>
      </SafeAreaView>

      <ColorPicker
        open={showColorPicker}
        onOpenChange={setShowColorPicker}
        selectedColor={color}
        onColorSelect={setColor}
      />
    </YStack>
  );
}
