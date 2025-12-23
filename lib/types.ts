export interface Tracker {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  color: string;
  created_at: string;
  last_restart_at: string;
  restart_count: number;
  cloud_synced: boolean;
  cloud_id: string | null;
}

export interface Observation {
  id: string;
  tracker_id: string;
  text: string;
  image_path: string | null;
  created_at: string;
  cloud_synced: boolean;
  cloud_id: string | null;
}

export interface UserPreferences {
  user_id: string | null;
  cloud_enabled: boolean;
  premium_active: boolean;
  premium_expires_at: string | null;
  theme: 'light' | 'dark' | 'system';
}
