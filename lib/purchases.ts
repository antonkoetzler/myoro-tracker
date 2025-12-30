import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as database from './database';
import { activatePremium } from './premium';

const PREMIUM_PRODUCT_ID = 'premium_monthly';

let isInitialized = false;

export async function initializePurchases(): Promise<void> {
  if (isInitialized) return;

  try {
    const isAvailable = await InAppPurchases.isAvailableAsync();
    if (!isAvailable) {
      console.warn('In-app purchases not available on this device');
      return;
    }

    await InAppPurchases.connectAsync();
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing purchases:', error);
    throw error;
  }
}

export async function getPremiumProduct(): Promise<InAppPurchases.InAppPurchase | null> {
  try {
    await initializePurchases();
    const products = await InAppPurchases.getProductsAsync([PREMIUM_PRODUCT_ID]);
    return products.results.find((p) => p.productId === PREMIUM_PRODUCT_ID) || null;
  } catch (error) {
    console.error('Error fetching premium product:', error);
    return null;
  }
}

export async function purchasePremium(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await initializePurchases();
    const product = await getPremiumProduct();

    if (!product) {
      return {
        success: false,
        error: 'Premium subscription product not found. Please try again later.',
      };
    }

    const purchase = await InAppPurchases.purchaseItemAsync(PREMIUM_PRODUCT_ID);

    if (purchase.responseCode === InAppPurchases.IAPResponseCode.OK) {
      const receipt = purchase.results?.[0];
      if (!receipt) {
        return {
          success: false,
          error: 'Purchase completed but receipt not found.',
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'You must be signed in to activate premium.',
        };
      }

      const purchaseData = {
        user_id: user.id,
        product_id: receipt.productId,
        transaction_id: receipt.transactionId,
        purchase_token: receipt.purchaseToken || receipt.transactionReceipt,
        platform: Platform.OS,
        purchase_date: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('purchase_receipts')
        .insert(purchaseData);

      if (dbError) {
        console.error('Error saving purchase receipt:', dbError);
      }

      await activatePremium(user.id, receipt);

      return { success: true };
    } else if (
      purchase.responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED
    ) {
      return {
        success: false,
        error: 'Purchase was canceled.',
      };
    } else {
      return {
        success: false,
        error: `Purchase failed with code: ${purchase.responseCode}`,
      };
    }
  } catch (error) {
    console.error('Error purchasing premium:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function restorePurchases(): Promise<{
  success: boolean;
  restored: boolean;
  error?: string;
}> {
  try {
    await initializePurchases();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        restored: false,
        error: 'You must be signed in to restore purchases.',
      };
    }

    const history = await InAppPurchases.getPurchaseHistoryAsync();

    if (history.responseCode === InAppPurchases.IAPResponseCode.OK) {
      const premiumPurchases = history.results?.filter(
        (p) => p.productId === PREMIUM_PRODUCT_ID,
      );

      if (premiumPurchases && premiumPurchases.length > 0) {
        const latestPurchase = premiumPurchases[0];
        await activatePremium(user.id, latestPurchase);

        return { success: true, restored: true };
      }

      return { success: true, restored: false };
    } else {
      return {
        success: false,
        restored: false,
        error: `Failed to restore purchases: ${history.responseCode}`,
      };
    }
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return {
      success: false,
      restored: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function disconnectPurchases(): Promise<void> {
  if (isInitialized) {
    try {
      await InAppPurchases.disconnectAsync();
      isInitialized = false;
    } catch (error) {
      console.error('Error disconnecting purchases:', error);
    }
  }
}

