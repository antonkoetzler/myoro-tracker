import { supabase } from './supabase';
import * as database from './database';
import type { Tracker, Observation, UserPreferences } from './types';
import * as FileSystem from 'expo-file-system';

export async function syncToCloud(userId: string | null): Promise<void> {
  if (!userId) return;

  const prefs = await database.getUserPreferences(userId);
  if (!prefs.cloud_enabled) return;

  // Sync trackers
  const trackers = await database.getAllTrackers(userId);
  for (const tracker of trackers) {
    if (!tracker.cloud_synced || !tracker.cloud_id) {
      try {
        const { data, error } = await supabase
          .from('trackers')
          .upsert({
            id: tracker.cloud_id || undefined,
            user_id: userId,
            name: tracker.name,
            description: tracker.description,
            color: tracker.color || '#3B82F6',
            created_at: tracker.created_at,
            last_restart_at: tracker.last_restart_at,
            restart_count: tracker.restart_count,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          await database.updateTracker(tracker.id, {
            cloud_synced: true,
            cloud_id: data.id,
          });
        }
      } catch (error) {
        console.error('Error syncing tracker:', error);
      }
    }
  }

  // Sync observations
  for (const tracker of trackers) {
    if (!tracker.cloud_id) continue; // Skip if tracker not synced yet

    const observations = await database.getObservationsByTracker(tracker.id);
    for (const obs of observations) {
      if (!obs.cloud_synced || !obs.cloud_id) {
        try {
          let imageUrl = null;
          if (obs.image_path) {
            try {
              // Upload image to Supabase storage
              const imageData = await FileSystem.readAsStringAsync(
                obs.image_path,
                {
                  encoding: FileSystem.EncodingType.Base64,
                },
              );
              const fileName = `${userId}/${obs.id}.jpg`;
              const { data: uploadData, error: uploadError } =
                await supabase.storage
                  .from('observations')
                  .upload(fileName, decode(imageData), {
                    contentType: 'image/jpeg',
                    upsert: true,
                  });

              if (!uploadError && uploadData) {
                const { data: urlData } = await supabase.storage
                  .from('observations')
                  .createSignedUrl(fileName, 31536000);
                imageUrl = urlData?.signedUrl || null;
              }
            } catch (imgError) {
              console.error('Error uploading image:', imgError);
            }
          }

          const { data, error } = await supabase
            .from('observations')
            .upsert({
              id: obs.cloud_id || undefined,
              tracker_id: tracker.cloud_id,
              text: obs.text,
              image_url: imageUrl,
              created_at: obs.created_at,
            })
            .select()
            .single();

          if (error) {
            console.error('Error syncing observation:', error);
            continue;
          }
          if (data) {
            await database.updateObservation(obs.id, {
              cloud_synced: true,
              cloud_id: data.id,
            });
          }
        } catch (error) {
          console.error('Error syncing observation:', error);
        }
      }
    }
  }
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function syncFromCloud(userId: string | null): Promise<void> {
  if (!userId) return;

  const prefs = await database.getUserPreferences(userId);
  if (!prefs.cloud_enabled) return;

  try {
    // Fetch trackers from Supabase
    const { data: trackers, error: trackersError } = await supabase
      .from('trackers')
      .select('*')
      .eq('user_id', userId);

    if (trackersError) throw trackersError;

    if (trackers) {
      for (const cloudTracker of trackers) {
        // Check if local tracker exists with this cloud_id
        const localTrackers = await database.getAllTrackers(userId);
        const existing = localTrackers.find(
          (t) => t.cloud_id === cloudTracker.id,
        );

        if (existing) {
          // Update existing
          await database.updateTracker(existing.id, {
            name: cloudTracker.name,
            description: cloudTracker.description,
            color: cloudTracker.color || '#3B82F6',
            last_restart_at: cloudTracker.last_restart_at,
            restart_count: cloudTracker.restart_count,
            cloud_synced: true,
            cloud_id: cloudTracker.id,
          });
        } else {
          // Create new local tracker
          const newTracker = await database.createTracker({
            user_id: userId,
            name: cloudTracker.name,
            description: cloudTracker.description,
            color: cloudTracker.color || '#3B82F6',
            created_at: cloudTracker.created_at,
            last_restart_at: cloudTracker.last_restart_at,
            restart_count: cloudTracker.restart_count,
          });
          await database.updateTracker(newTracker.id, {
            cloud_synced: true,
            cloud_id: cloudTracker.id,
          });
        }
      }
    }

    // Fetch observations from Supabase
    if (trackers) {
      for (const cloudTracker of trackers) {
        const { data: observations, error: obsError } = await supabase
          .from('observations')
          .select('*')
          .eq('tracker_id', cloudTracker.id);

        if (obsError) continue;

        if (observations) {
          const localTrackers = await database.getAllTrackers(userId);
          const localTracker = localTrackers.find(
            (t) => t.cloud_id === cloudTracker.id,
          );
          if (!localTracker) continue;

          for (const cloudObs of observations) {
            const localObservations = await database.getObservationsByTracker(
              localTracker.id,
            );
            const existing = localObservations.find(
              (o) => o.cloud_id === cloudObs.id,
            );

            if (!existing) {
              // Download image if exists
              let imagePath = null;
              if (cloudObs.image_url) {
                try {
                  const fileName = `${cloudObs.id}.jpg`;
                  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
                  
                  let signedUrl = cloudObs.image_url;
                  
                  if (!cloudObs.image_url.includes('?')) {
                    const { data: urlData } = await supabase.storage
                      .from('observations')
                      .createSignedUrl(`${userId}/${fileName}`, 3600);
                    signedUrl = urlData?.signedUrl || cloudObs.image_url;
                  }
                  
                  const response = await fetch(signedUrl);
                  if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status}`);
                  }
                  
                  const blob = await response.blob();
                  const reader = new FileReader();
                  await new Promise((resolve, reject) => {
                    reader.onloadend = async () => {
                      try {
                        const base64 = reader.result as string;
                        await FileSystem.writeAsStringAsync(
                          fileUri,
                          base64.split(',')[1],
                          {
                            encoding: FileSystem.EncodingType.Base64,
                          },
                        );
                        imagePath = fileUri;
                        resolve(null);
                      } catch (error) {
                        reject(error);
                      }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                } catch (error) {
                  console.error('Error downloading image:', error);
                }
              }

              const newObs = await database.createObservation({
                tracker_id: localTracker.id,
                text: cloudObs.text,
                image_path: imagePath,
                created_at: cloudObs.created_at,
              });
              await database.updateObservation(newObs.id, {
                cloud_synced: true,
                cloud_id: cloudObs.id,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error syncing from cloud:', error);
  }
}

export function setupRealtimeListeners(
  userId: string | null,
  onUpdate: () => void,
): () => void {
  if (!userId) return () => {};

  const channel = supabase
    .channel('trackers-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trackers',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        syncFromCloud(userId).then(onUpdate);
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'observations',
      },
      () => {
        syncFromCloud(userId).then(onUpdate);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function syncUserPreferencesToCloud(
  userId: string | null,
): Promise<void> {
  if (!userId) return;

  try {
    const localPrefs = await database.getUserPreferences(userId);

    const { error } = await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        cloud_enabled: localPrefs.cloud_enabled,
        premium_active: localPrefs.premium_active,
        premium_expires_at: localPrefs.premium_expires_at,
        theme: localPrefs.theme,
      },
      {
        onConflict: 'user_id',
      },
    );

    if (error) {
      console.error('Error syncing user preferences to cloud:', error);
    }
  } catch (error) {
    console.error('Error syncing user preferences to cloud:', error);
  }
}

export async function syncUserPreferencesFromCloud(
  userId: string | null,
): Promise<void> {
  if (!userId) return;

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error syncing user preferences from cloud:', error);
      return;
    }

    if (data) {
      await database.updateUserPreferences(userId, {
        cloud_enabled: data.cloud_enabled,
        premium_active: data.premium_active,
        premium_expires_at: data.premium_expires_at,
        theme: (data.theme as 'light' | 'dark' | 'system') || 'system',
      });
    }
  } catch (error) {
    console.error('Error syncing user preferences from cloud:', error);
  }
}

export async function deleteCloudData(userId: string | null): Promise<void> {
  if (!userId) return;

  try {
    // Delete storage files
    const { data: files } = await supabase.storage
      .from('observations')
      .list(userId);

    if (files) {
      const filePaths = files.map((file) => `${userId}/${file.name}`);
      if (filePaths.length > 0) {
        await supabase.storage.from('observations').remove(filePaths);
      }
    }

    // Delete observations first
    const { data: trackers } = await supabase
      .from('trackers')
      .select('id')
      .eq('user_id', userId);

    if (trackers) {
      for (const tracker of trackers) {
        await supabase
          .from('observations')
          .delete()
          .eq('tracker_id', tracker.id);
      }
    }

    // Delete trackers
    await supabase.from('trackers').delete().eq('user_id', userId);
  } catch (error) {
    console.error('Error deleting cloud data:', error);
  }
}
