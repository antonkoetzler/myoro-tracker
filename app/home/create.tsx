import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { YStack, Button, Text, Input, TextArea, Spinner } from 'tamagui';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';

export default function CreateTrackerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const prefs = await database.getUserPreferences(user?.id || null);
      const count = await database.getTrackerCount(user?.id || null);

      if (!prefs.premium_active && count >= 10) {
        alert(t('screens.home.trackerLimit'));
        return;
      }

      await database.createTracker({
        user_id: user?.id || null,
        name: name.trim(),
        description: description.trim(),
        created_at: new Date().toISOString(),
        last_restart_at: new Date().toISOString(),
        restart_count: 0,
      });

      router.back();
    } catch (error) {
      console.error('Error creating tracker:', error);
      alert('Failed to create tracker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <Text fontSize="$6" fontWeight="bold">
        {t('screens.home.createTracker')}
      </Text>

      <YStack gap="$3">
        <YStack gap="$2">
          <Text>{t('screens.details.name')}</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('screens.details.name')}
          />
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
        marginTop="auto"
      >
        {loading ? <Spinner /> : <Text>{t('common.save')}</Text>}
      </Button>
    </YStack>
  );
}

