# Setup TODO

## 7. Configure OAuth Providers (Optional)

1. Go to Supabase Dashboard > Authentication > Providers
2. Click on the provider you want (Google, Apple, GitHub)
3. **For Google:**
   - Go to <https://console.cloud.google.com/apis/credentials>
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URI to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret
   - Paste them into Supabase > Authentication > Providers > Google
4. **For Apple:**
   - Similar process via Apple Developer Console
5. **For GitHub:**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create new OAuth app
   - Set callback URL to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

## 8. Run the App

```bash
yarn start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan QR code with Expo Go app.
