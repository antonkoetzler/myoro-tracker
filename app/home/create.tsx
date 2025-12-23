import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.show('Error', { message: 'Name is required' });
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

      await database.createTracker({
        user_id: user?.id || null,
        name: name.trim(),
        description: description.trim(),
        color,
        created_at: new Date().toISOString(),
        last_restart_at: new Date().toISOString(),
        restart_count: 0,
      });

      toast.show('Success', { message: 'Tracker created successfully' });
      router.back();
    } catch (error) {
      console.error('Error creating tracker:', error);
      toast.show('Error', { message: 'Failed to create tracker' });
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

      <YStack flex={1} p="$4" gap="$4">
        <YStack gap="$3">
          <YStack gap="$2">
            <Text>{t('screens.details.name')}</Text>
            <XStack gap="$2" items="center">
              <Button
                size="$4"
                circular
                bg={color}
                borderWidth={2}
                borderColor="$borderColor"
                onPress={() => setShowColorPicker(true)}
                pressStyle={{ scale: 0.9 }}
              />
              <Input
                flex={1}
                value={name}
                onChangeText={setName}
                placeholder={t('screens.details.name')}
              />
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Text>{t('screens.details.description')}</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder={t('screens.details.description')}
              minHeight={100}
            />
          </YStack>
        </YStack>

        <Button
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          mt="auto"
        >
          {loading ? <Spinner /> : <Text>{t('common.save')}</Text>}
        </Button>
      </YStack>

      <ColorPicker
        open={showColorPicker}
        onOpenChange={setShowColorPicker}
        selectedColor={color}
        onColorSelect={setColor}
      />
    </YStack>
  );
}
