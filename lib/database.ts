import * as SQLite from 'expo-sqlite';
import type { Tracker, Observation, UserPreferences } from './types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('tracker.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS trackers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at TEXT NOT NULL,
      last_restart_at TEXT NOT NULL,
      restart_count INTEGER DEFAULT 0,
      cloud_synced INTEGER DEFAULT 0,
      cloud_id TEXT
    );

    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      tracker_id TEXT NOT NULL,
      text TEXT,
      image_path TEXT,
      created_at TEXT NOT NULL,
      cloud_synced INTEGER DEFAULT 0,
      cloud_id TEXT,
      FOREIGN KEY (tracker_id) REFERENCES trackers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      cloud_enabled INTEGER DEFAULT 0,
      premium_active INTEGER DEFAULT 0,
      premium_expires_at TEXT,
      theme TEXT DEFAULT 'system'
    );

    CREATE INDEX IF NOT EXISTS idx_trackers_user_id ON trackers(user_id);
    CREATE INDEX IF NOT EXISTS idx_observations_tracker_id ON observations(tracker_id);
  `);

  // Migrations: Add color column if it doesn't exist
  try {
    await db.execAsync(`
      ALTER TABLE trackers ADD COLUMN color TEXT DEFAULT '#3B82F6';
    `);
  } catch (error) {
    // Column already exists, ignore
  }

  // Migrations: Add theme column if it doesn't exist
  try {
    await db.execAsync(`
      ALTER TABLE user_preferences ADD COLUMN theme TEXT DEFAULT 'system';
    `);
  } catch (error) {
    // Column already exists, ignore
  }

  return db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return await initDatabase();
  }
  return db;
}

// Tracker operations
export async function getAllTrackers(
  userId: string | null,
): Promise<Tracker[]> {
  const database = await getDatabase();
  let result: Tracker[];
  if (userId === null) {
    result = await database.getAllAsync<Tracker>(
      'SELECT * FROM trackers WHERE user_id IS NULL ORDER BY created_at DESC',
    );
  } else {
    result = await database.getAllAsync<Tracker>(
      'SELECT * FROM trackers WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
  }
  return result;
}

export async function getTracker(id: string): Promise<Tracker | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Tracker>(
    'SELECT * FROM trackers WHERE id = ?',
    [id],
  );
  return result || null;
}

export async function createTracker(
  tracker: Omit<Tracker, 'id' | 'cloud_synced' | 'cloud_id'>,
): Promise<Tracker> {
  const database = await getDatabase();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  await database.runAsync(
    'INSERT INTO trackers (id, user_id, name, description, color, created_at, last_restart_at, restart_count, cloud_synced, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      tracker.user_id,
      tracker.name,
      tracker.description,
      tracker.color || '#3B82F6',
      now,
      now,
      tracker.restart_count,
      0,
      null,
    ],
  );

  const created = await getTracker(id);
  if (!created) throw new Error('Failed to create tracker');
  return created;
}

export async function updateTracker(
  id: string,
  updates: Partial<Tracker>,
): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.last_restart_at !== undefined) {
    fields.push('last_restart_at = ?');
    values.push(updates.last_restart_at);
  }
  if (updates.restart_count !== undefined) {
    fields.push('restart_count = ?');
    values.push(updates.restart_count);
  }
  if (updates.cloud_synced !== undefined) {
    fields.push('cloud_synced = ?');
    values.push(updates.cloud_synced ? 1 : 0);
  }
  if (updates.cloud_id !== undefined) {
    fields.push('cloud_id = ?');
    values.push(updates.cloud_id);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(
    `UPDATE trackers SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function deleteTracker(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM trackers WHERE id = ?', [id]);
}

// Observation operations
export async function getObservationsByTracker(
  trackerId: string,
): Promise<Observation[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<Observation>(
    'SELECT * FROM observations WHERE tracker_id = ? ORDER BY created_at DESC',
    [trackerId],
  );
  return result;
}

export async function createObservation(
  observation: Omit<Observation, 'id' | 'cloud_synced' | 'cloud_id'>,
): Promise<Observation> {
  const database = await getDatabase();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  await database.runAsync(
    'INSERT INTO observations (id, tracker_id, text, image_path, created_at, cloud_synced, cloud_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      observation.tracker_id,
      observation.text,
      observation.image_path,
      now,
      0,
      null,
    ],
  );

  const created = await database.getFirstAsync<Observation>(
    'SELECT * FROM observations WHERE id = ?',
    [id],
  );
  if (!created) throw new Error('Failed to create observation');
  return created;
}

export async function updateObservation(
  id: string,
  updates: Partial<Observation>,
): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.text !== undefined) {
    fields.push('text = ?');
    values.push(updates.text);
  }
  if (updates.image_path !== undefined) {
    fields.push('image_path = ?');
    values.push(updates.image_path);
  }
  if (updates.cloud_synced !== undefined) {
    fields.push('cloud_synced = ?');
    values.push(updates.cloud_synced ? 1 : 0);
  }
  if (updates.cloud_id !== undefined) {
    fields.push('cloud_id = ?');
    values.push(updates.cloud_id);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(
    `UPDATE observations SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}

export async function deleteObservation(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM observations WHERE id = ?', [id]);
}

// User preferences operations
export async function getUserPreferences(
  userId: string | null,
): Promise<UserPreferences> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<UserPreferences>(
    'SELECT * FROM user_preferences WHERE user_id = ?',
    [userId],
  );

  if (!result) {
    const defaultPrefs: UserPreferences = {
      user_id: userId,
      cloud_enabled: false,
      premium_active: false,
      premium_expires_at: null,
      theme: 'system',
    };
    await database.runAsync(
      'INSERT INTO user_preferences (user_id, cloud_enabled, premium_active, premium_expires_at, theme) VALUES (?, ?, ?, ?, ?)',
      [userId, 0, 0, null, 'system'],
    );
    return defaultPrefs;
  }

  return {
    ...result,
    cloud_enabled: false, // Always false, not used in business logic
    premium_active: Boolean(result.premium_active),
    theme: (result.theme as 'light' | 'dark' | 'system') || 'system',
  };
}

export async function updateUserPreferences(
  userId: string | null,
  updates: Partial<UserPreferences>,
): Promise<void> {
  const database = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  // cloud_enabled removed from business logic - always sync if user logged in
  if (updates.premium_active !== undefined) {
    fields.push('premium_active = ?');
    values.push(updates.premium_active ? 1 : 0);
  }
  if (updates.premium_expires_at !== undefined) {
    fields.push('premium_expires_at = ?');
    values.push(updates.premium_expires_at);
  }
  if (updates.theme !== undefined) {
    fields.push('theme = ?');
    values.push(updates.theme);
  }

  if (fields.length === 0) return;

  values.push(userId);
  await database.runAsync(
    `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`,
    values,
  );
}

export async function getTrackerCount(userId: string | null): Promise<number> {
  const database = await getDatabase();
  let result: { count: number } | null;
  if (userId === null) {
    result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM trackers WHERE user_id IS NULL',
    );
  } else {
    result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM trackers WHERE user_id = ?',
      [userId],
    );
  }
  return result?.count || 0;
}
