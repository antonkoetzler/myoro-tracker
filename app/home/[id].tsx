import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  YStack,
  XStack,
  Button,
  Text,
  ScrollView,
  Card,
  Image,
  TextArea,
  Spinner,
  Separator,
} from 'tamagui';
import { ArrowLeft, RotateCcw, Plus } from '@tamagui/lucide-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import * as database from '../../lib/database';
import type { Tracker, Observation } from '../../lib/types';

export default function TrackerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [observationImage, setObservationImage] = useState<string | null>(null);
  const [addingObservation, setAddingObservation] = useState(false);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    loadTracker();
    loadObservations();
    checkPremium();
  }, [id]);

  const checkPremium = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const prefs = await database.getUserPreferences(user?.id || null);
    setPremium(prefs.premium_active);
  };

  const loadTracker = async () => {
    try {
      if (!id) return;
      const trackerData = await database.getTracker(id);
      setTracker(trackerData);
    } catch (error) {
      console.error('Error loading tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadObservations = async () => {
    try {
      if (!id) return;
      const obs = await database.getObservationsByTracker(id);
      setObservations(obs);
    } catch (error) {
      console.error('Error loading observations:', error);
    }
  };

  const handleRestart = async () => {
    if (!tracker) return;

    try {
      setRestarting(true);
      await database.updateTracker(tracker.id, {
        last_restart_at: new Date().toISOString(),
        restart_count: tracker.restart_count + 1,
      });
      await loadTracker();
    } catch (error) {
      console.error('Error restarting tracker:', error);
    } finally {
      setRestarting(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = `${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: asset.uri,
        to: fileUri,
      });

      setObservationImage(fileUri);
    }
  };

  const handleAddObservation = async () => {
    if (!tracker || (!observationText.trim() && !observationImage)) return;

    try {
      setAddingObservation(true);
      await database.createObservation({
        tracker_id: tracker.id,
        text: observationText.trim(),
        image_path: observationImage,
      });

      setObservationText('');
      setObservationImage(null);
      setShowAddObservation(false);
      await loadObservations();
    } catch (error) {
      console.error('Error adding observation:', error);
      alert('Failed to add observation');
    } finally {
      setAddingObservation(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (!tracker) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Text>Tracker not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} bg="$background">
      <XStack
        p="$4"
        items="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Button
          size="$3"
          circular
          icon={ArrowLeft}
          onPress={() => router.back()}
        />
        <Text fontSize="$6" fontWeight="bold" flex={1}>
          {tracker.name}
        </Text>
      </XStack>

      <ScrollView flex={1} contentContainerStyle={{ padding: 16 }}>
        <YStack gap="$4">
          <Card p="$4">
            <YStack gap="$3">
              <YStack gap="$2">
                <Text fontSize="$3" opacity={0.7}>
                  {t('screens.details.description')}
                </Text>
                <Text fontSize="$4">{tracker.description || '-'}</Text>
              </YStack>

              <Separator />

              <YStack gap="$2">
                <Text fontSize="$3" opacity={0.7}>
                  {t('screens.details.timeSinceCreated')}
                </Text>
                <Text fontSize="$4">{formatTime(tracker.created_at)}</Text>
              </YStack>

              <Separator />

              <YStack gap="$2">
                <Text fontSize="$3" opacity={0.7}>
                  {t('screens.details.timeSinceRestart')}
                </Text>
                <Text fontSize="$4">{formatTime(tracker.last_restart_at)}</Text>
              </YStack>

              {premium && (
                <>
                  <Separator />
                  <YStack gap="$2">
                    <Text fontSize="$3" opacity={0.7}>
                      {t('screens.details.restartCount')}
                    </Text>
                    <Text fontSize="$4">{tracker.restart_count}</Text>
                  </YStack>
                </>
              )}

              {!premium && (
                <>
                  <Separator />
                  <Text fontSize="$2" opacity={0.7}>
                    {t('screens.details.premiumRequired')}
                  </Text>
                </>
              )}
            </YStack>
          </Card>

          <Button
            icon={RotateCcw}
            onPress={handleRestart}
            disabled={restarting}
          >
            {restarting ? (
              <Spinner />
            ) : (
              <Text>{t('screens.details.restartTracker')}</Text>
            )}
          </Button>

          <XStack justify="space-between" items="center">
            <Text fontSize="$5" fontWeight="bold">
              {t('screens.details.observations')}
            </Text>
            <Button
              size="$3"
              circular
              icon={Plus}
              onPress={() => setShowAddObservation(!showAddObservation)}
            />
          </XStack>

          {showAddObservation && (
            <Card p="$4" gap="$3">
              <TextArea
                value={observationText}
                onChangeText={setObservationText}
                placeholder={t('screens.details.addObservation')}
                minHeight={100}
              />
              <Button onPress={handlePickImage} variant="outlined">
                <Text>{observationImage ? 'Change Image' : 'Pick Image'}</Text>
              </Button>
              {observationImage && (
                <Image
                  source={{ uri: observationImage }}
                  width="100%"
                  height={200}
                  borderRadius="$2"
                />
              )}
              <XStack gap="$3">
                <Button
                  flex={1}
                  onPress={() => setShowAddObservation(false)}
                  variant="outlined"
                >
                  <Text>{t('common.cancel')}</Text>
                </Button>
                <Button
                  flex={1}
                  onPress={handleAddObservation}
                  disabled={
                    addingObservation ||
                    (!observationText.trim() && !observationImage)
                  }
                >
                  {addingObservation ? (
                    <Spinner />
                  ) : (
                    <Text>{t('common.save')}</Text>
                  )}
                </Button>
              </XStack>
            </Card>
          )}

          {observations.length === 0 ? (
            <Text fontSize="$4" opacity={0.7} textAlign="center" p="$4">
              {t('screens.details.noObservations')}
            </Text>
          ) : (
            <YStack gap="$3">
              {observations.map((obs) => (
                <Card key={obs.id} p="$4">
                  <YStack gap="$2">
                    {obs.image_path && (
                      <Image
                        source={{ uri: obs.image_path }}
                        width="100%"
                        height={200}
                        borderRadius="$2"
                      />
                    )}
                    {obs.text && <Text fontSize="$4">{obs.text}</Text>}
                    <Text fontSize="$2" opacity={0.7}>
                      {new Date(obs.created_at).toLocaleString()}
                    </Text>
                  </YStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
