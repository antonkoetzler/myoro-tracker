# Setup TODO

## 1. Install Dependencies

```bash
yarn install
```

## 2. Set Up Environment Variables

- Copy `env.example` to `.env`
- Fill in your Supabase credentials:
  - `EXPO_PUBLIC_SUPABASE_URL` - Get from Supabase Dashboard > Settings > API
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Get from Supabase Dashboard > Settings > API

## 3. Set Up Supabase Project

1. Create a project at <https://supabase.com>
2. Get your project URL and anon key from Settings > API

## 4. Create Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Trackers table
CREATE TABLE trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_restart_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restart_count INTEGER DEFAULT 0
);

-- Observations table
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id UUID REFERENCES trackers(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  cloud_enabled BOOLEAN DEFAULT FALSE,
  premium_active BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own trackers" ON trackers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trackers" ON trackers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trackers" ON trackers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trackers" ON trackers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own observations" ON observations FOR SELECT USING (
  EXISTS (SELECT 1 FROM trackers WHERE trackers.id = observations.tracker_id AND trackers.user_id = auth.uid())
);
CREATE POLICY "Users can insert own observations" ON observations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trackers WHERE trackers.id = observations.tracker_id AND trackers.user_id = auth.uid())
);
CREATE POLICY "Users can update own observations" ON observations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trackers WHERE trackers.id = observations.tracker_id AND trackers.user_id = auth.uid())
);
CREATE POLICY "Users can delete own observations" ON observations FOR DELETE USING (
  EXISTS (SELECT 1 FROM trackers WHERE trackers.id = observations.tracker_id AND trackers.user_id = auth.uid())
);

CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
```

## 5. Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Create a new bucket named `observations`
3. Set it to **Public** access

## 6. Enable Realtime

1. Go to Supabase Dashboard > Database > Replication
2. Enable replication for `trackers` table
3. Enable replication for `observations` table

## 7. Configure OAuth Providers (Optional)

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google, Apple, and/or GitHub OAuth
3. Configure each provider with your OAuth credentials

## 8. Run the App

```bash
yarn start
```
