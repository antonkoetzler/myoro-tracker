# Manual Work Required

## 4. In-App Purchase Setup

### iOS (App Store Connect)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app (or create one if needed)
3. Go to **Features** > **In-App Purchases**
4. Click **+** to create a new subscription
5. Configure the subscription:
   - **Product ID**: `premium_monthly`
   - **Reference Name**: Premium Monthly Subscription
   - **Subscription Group**: Create a new group (e.g., "Premium Subscriptions")
   - **Subscription Duration**: 1 Month
   - **Price**: Set your price (e.g., $2.99/month)
6. Add subscription information and review information
7. Submit for review (if required)

### Android (Google Play Console)

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app (or create one if needed)
3. Go to **Monetize** > **Subscriptions**
4. Click **Create subscription**
5. Configure the subscription:
   - **Product ID**: `premium_monthly`
   - **Name**: Premium Monthly Subscription
   - **Billing period**: Monthly
   - **Price**: Set your price (e.g., $2.99/month)
6. Activate the subscription
7. Add subscription details and save

## 5. Testing In-App Purchases

### iOS Testing

1. Use a **Sandbox Tester** account in App Store Connect
2. Sign out of your regular Apple ID on the test device
3. When prompted during purchase, sign in with the sandbox tester account
4. Complete the test purchase (no real charge)

### Android Testing

1. Add test accounts in Google Play Console > **Settings** > **License testing**
2. Use a test account on the device
3. Complete the test purchase (no real charge)

## 6. Verify Database Schema

Verify that all tables exist and have the correct structure:

1. Go to Supabase Dashboard > **Table Editor**
2. Verify these tables exist:
   - `trackers` (with columns: id, user_id, name, description, color, created_at, last_restart_at, restart_count)
   - `observations` (with columns: id, tracker_id, text, image_url, created_at)
   - `user_preferences` (with columns: user_id, cloud_enabled, premium_active, premium_expires_at, theme)
   - `purchase_receipts` (with columns: id, user_id, product_id, transaction_id, purchase_token, platform, purchase_date, created_at)
3. Verify RLS is enabled on all tables
4. Verify indexes exist on `trackers.user_id` and `observations.tracker_id`
