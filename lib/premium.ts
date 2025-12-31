import { supabase } from './supabase';
import * as database from './database';
// import type { InAppPurchase } from 'expo-in-app-purchases';

const PREMIUM_DURATION_DAYS = 30;

export async function checkPremiumStatus(
  userId: string | null,
): Promise<boolean> {
  if (!userId) {
    const localPrefs = await database.getUserPreferences(null);
    return localPrefs.premium_active;
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('premium_active, premium_expires_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking premium status:', error);
      const localPrefs = await database.getUserPreferences(userId);
      return localPrefs.premium_active;
    }

    if (!data) {
      return false;
    }

    if (data.premium_active) {
      if (data.premium_expires_at) {
        const expiresAt = new Date(data.premium_expires_at);
        const now = new Date();

        if (expiresAt < now) {
          await deactivatePremium(userId);
          return false;
        }
      }

      await syncPremiumToLocal(
        userId,
        data.premium_active,
        data.premium_expires_at,
      );
      return true;
    }

    await syncPremiumToLocal(userId, false, null);
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    const localPrefs = await database.getUserPreferences(userId);
    return localPrefs.premium_active;
  }
}

export async function activatePremium(
  userId: string,
  // purchase: InAppPurchase,
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PREMIUM_DURATION_DAYS);

  try {
    const { error: upsertError } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          premium_active: true,
          premium_expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      );

    if (upsertError) {
      throw upsertError;
    }

    await syncPremiumToLocal(userId, true, expiresAt.toISOString());
  } catch (error) {
    console.error('Error activating premium:', error);
    throw error;
  }
}

export async function deactivatePremium(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        premium_active: false,
        premium_expires_at: null,
      })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    await syncPremiumToLocal(userId, false, null);
  } catch (error) {
    console.error('Error deactivating premium:', error);
    throw error;
  }
}

async function syncPremiumToLocal(
  userId: string | null,
  premiumActive: boolean,
  premiumExpiresAt: string | null,
): Promise<void> {
  try {
    await database.updateUserPreferences(userId, {
      premium_active: premiumActive,
      premium_expires_at: premiumExpiresAt,
    });
  } catch (error) {
    console.error('Error syncing premium to local:', error);
  }
}
