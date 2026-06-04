import * as SQLite from 'expo-sqlite';
import type { ThemeId } from './themes';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('kids_rewards.db');
  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_pin TEXT NOT NULL,
      cloud_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar TEXT,
      theme TEXT NOT NULL DEFAULT 'ocean',
      currency_balance INTEGER NOT NULL DEFAULT 0,
      money_balance_cents INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      icon TEXT,
      currency_value INTEGER NOT NULL DEFAULT 1,
      frequency TEXT NOT NULL DEFAULT 'daily',
      approval_mode TEXT NOT NULL DEFAULT 'instant',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quest_assignments (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      due_date INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      photo_url TEXT,
      completed_at INTEGER,
      approved_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS behavior_events (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      currency_delta INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      icon TEXT,
      currency_cost INTEGER NOT NULL,
      redemption_mode TEXT NOT NULL DEFAULT 'approval',
      real_money_value_cents INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      reward_id TEXT NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      badge_type TEXT NOT NULL,
      earned_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_progress (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      week INTEGER NOT NULL,
      character_position REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE (child_id, year, month, week)
    );

    CREATE TABLE IF NOT EXISTS money_ledger (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL
    );
  `);
}

export interface Family {
  id: string;
  name: string;
  parent_pin: string;
  cloud_id: string | null;
  created_at: number;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  avatar: string | null;
  theme: ThemeId;
  currency_balance: number;
  money_balance_cents: number;
  created_at: number;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getFamily(): Promise<Family | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Family>('SELECT * FROM families LIMIT 1');
  return row ?? null;
}

export async function createFamily(name: string, parentPin: string): Promise<Family> {
  const db = await getDb();
  const id = uuid();
  const created_at = Date.now();
  await db.runAsync(
    'INSERT INTO families (id, name, parent_pin, cloud_id, created_at) VALUES (?, ?, ?, NULL, ?)',
    id,
    name,
    parentPin,
    created_at,
  );
  return { id, name, parent_pin: parentPin, cloud_id: null, created_at };
}

export async function verifyParentPin(pin: string): Promise<boolean> {
  const family = await getFamily();
  return !!family && family.parent_pin === pin;
}

export async function listChildren(familyId: string): Promise<Child[]> {
  const db = await getDb();
  return db.getAllAsync<Child>(
    'SELECT * FROM children WHERE family_id = ? ORDER BY created_at ASC',
    familyId,
  );
}

export async function addChild(
  familyId: string,
  name: string,
  theme: ThemeId,
  avatar: string | null = null,
): Promise<Child> {
  const db = await getDb();
  const id = uuid();
  const created_at = Date.now();
  await db.runAsync(
    `INSERT INTO children (id, family_id, name, avatar, theme, currency_balance, money_balance_cents, created_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
    id,
    familyId,
    name,
    avatar,
    theme,
    created_at,
  );
  return {
    id,
    family_id: familyId,
    name,
    avatar,
    theme,
    currency_balance: 0,
    money_balance_cents: 0,
    created_at,
  };
}

export async function updateChildTheme(childId: string, theme: ThemeId): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE children SET theme = ? WHERE id = ?', theme, childId);
}
