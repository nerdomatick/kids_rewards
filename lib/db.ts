import * as SQLite from 'expo-sqlite';
import type { ThemeId } from './themes';

let dbInstance: SQLite.SQLiteDatabase | null = null;

const SCHEMA_VERSION = 3;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('kids_rewards.db');
  await migrate(dbInstance);
  return dbInstance;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = Number(row?.user_version ?? 0) || 0;

  // Self-healing check: even if user_version looks current, verify the actual
  // schema of a few key tables has the columns we expect.
  const tables = await db.getAllAsync<{ name: string; sql: string | null }>(
    "SELECT name, sql FROM sqlite_master WHERE type='table'",
  );
  const tableMap = new Map(tables.map((t) => [t.name, t.sql ?? '']));
  const schemaOutdated =
    (tableMap.has('rewards') && !tableMap.get('rewards')!.includes('icon_emoji')) ||
    (tableMap.has('quests') && !tableMap.get('quests')!.includes('reward_type')) ||
    (tableMap.has('children') && !tableMap.get('children')!.includes('avatar_emoji'));

  if (current < SCHEMA_VERSION || schemaOutdated) {
    // Pre-launch: drop and recreate. Replace with proper migrations after first release.
    // Drop one statement at a time so a single failure can't leave us partially migrated.
    const dropTargets = [
      'money_ledger',
      'map_progress',
      'badges',
      'redemptions',
      'rewards',
      'behavior_events',
      'quest_assignments',
      'quest_children',
      'quests',
      'children',
      'families',
    ];
    for (const t of dropTargets) {
      await db.execAsync(`DROP TABLE IF EXISTS ${t};`);
    }
  }

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
      avatar_emoji TEXT,
      avatar_uri TEXT,
      color TEXT NOT NULL DEFAULT '#0077B6',
      theme TEXT NOT NULL DEFAULT 'ocean',
      currency_balance INTEGER NOT NULL DEFAULT 0,
      money_balance_cents INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      icon_emoji TEXT,
      icon_uri TEXT,
      reward_type TEXT NOT NULL DEFAULT 'currency',
      currency_value INTEGER NOT NULL DEFAULT 1,
      reward_item_name TEXT,
      frequency TEXT NOT NULL DEFAULT 'once',
      requires_approval INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quest_children (
      quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      PRIMARY KEY (quest_id, child_id)
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
      icon_emoji TEXT,
      icon_uri TEXT,
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

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

// ----- Types -----

export type RewardType = 'currency' | 'item';
export type QuestFrequency = 'once' | 'daily' | 'weekly' | 'monthly';
export type AssignmentStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

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
  avatar_emoji: string | null;
  avatar_uri: string | null;
  color: string;
  theme: ThemeId;
  currency_balance: number;
  money_balance_cents: number;
  created_at: number;
}

export interface Quest {
  id: string;
  family_id: string;
  title: string;
  icon_emoji: string | null;
  icon_uri: string | null;
  reward_type: RewardType;
  currency_value: number;
  reward_item_name: string | null;
  frequency: QuestFrequency;
  requires_approval: number;
  is_active: number;
  created_at: number;
}

export interface QuestWithChildren extends Quest {
  child_ids: string[];
}

export interface PendingApproval {
  assignment_id: string;
  quest_id: string;
  quest_title: string;
  quest_icon_emoji: string | null;
  quest_icon_uri: string | null;
  reward_type: RewardType;
  currency_value: number;
  reward_item_name: string | null;
  child_id: string;
  child_name: string;
  child_color: string;
  completed_at: number;
  photo_url: string | null;
}

// ----- UUID -----

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ----- Family -----

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

// ----- Children -----

export interface ChildInput {
  name: string;
  avatar_emoji?: string | null;
  avatar_uri?: string | null;
  color: string;
  theme: ThemeId;
}

export async function listChildren(familyId: string): Promise<Child[]> {
  const db = await getDb();
  return db.getAllAsync<Child>(
    'SELECT * FROM children WHERE family_id = ? ORDER BY created_at ASC',
    familyId,
  );
}

export async function addChild(familyId: string, input: ChildInput): Promise<Child> {
  const db = await getDb();
  const id = uuid();
  const created_at = Date.now();
  await db.runAsync(
    `INSERT INTO children (id, family_id, name, avatar_emoji, avatar_uri, color, theme, currency_balance, money_balance_cents, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    id,
    familyId,
    input.name,
    input.avatar_emoji ?? null,
    input.avatar_uri ?? null,
    input.color,
    input.theme,
    created_at,
  );
  return {
    id,
    family_id: familyId,
    name: input.name,
    avatar_emoji: input.avatar_emoji ?? null,
    avatar_uri: input.avatar_uri ?? null,
    color: input.color,
    theme: input.theme,
    currency_balance: 0,
    money_balance_cents: 0,
    created_at,
  };
}

export async function updateChild(childId: string, input: ChildInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE children SET name = ?, avatar_emoji = ?, avatar_uri = ?, color = ?, theme = ? WHERE id = ?`,
    input.name,
    input.avatar_emoji ?? null,
    input.avatar_uri ?? null,
    input.color,
    input.theme,
    childId,
  );
}

export async function deleteChild(childId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM children WHERE id = ?', childId);
}

export async function adjustChildCurrency(
  childId: string,
  delta: number,
  note: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE children SET currency_balance = currency_balance + ? WHERE id = ?',
    delta,
    childId,
  );
  await db.runAsync(
    'INSERT INTO behavior_events (id, child_id, label, currency_delta, created_at) VALUES (?, ?, ?, ?, ?)',
    uuid(),
    childId,
    note,
    delta,
    Date.now(),
  );
}

// ----- Quests -----

export interface QuestInput {
  title: string;
  icon_emoji?: string | null;
  icon_uri?: string | null;
  reward_type: RewardType;
  currency_value: number;
  reward_item_name?: string | null;
  frequency: QuestFrequency;
  requires_approval: boolean;
  child_ids: string[];
}

export async function listQuests(familyId: string): Promise<QuestWithChildren[]> {
  const db = await getDb();
  const quests = await db.getAllAsync<Quest>(
    'SELECT * FROM quests WHERE family_id = ? AND is_active = 1 ORDER BY created_at DESC',
    familyId,
  );
  if (quests.length === 0) return [];
  const links = await db.getAllAsync<{ quest_id: string; child_id: string }>(
    `SELECT quest_id, child_id FROM quest_children WHERE quest_id IN (${quests
      .map(() => '?')
      .join(',')})`,
    ...quests.map((q) => q.id),
  );
  const byId = new Map<string, string[]>();
  for (const l of links) {
    if (!byId.has(l.quest_id)) byId.set(l.quest_id, []);
    byId.get(l.quest_id)!.push(l.child_id);
  }
  return quests.map((q) => ({ ...q, child_ids: byId.get(q.id) ?? [] }));
}

export async function addQuest(familyId: string, input: QuestInput): Promise<string> {
  const db = await getDb();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO quests (id, family_id, title, icon_emoji, icon_uri, reward_type, currency_value,
      reward_item_name, frequency, requires_approval, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    id,
    familyId,
    input.title,
    input.icon_emoji ?? null,
    input.icon_uri ?? null,
    input.reward_type,
    input.currency_value,
    input.reward_item_name ?? null,
    input.frequency,
    input.requires_approval ? 1 : 0,
    Date.now(),
  );
  for (const cid of input.child_ids) {
    await db.runAsync(
      'INSERT INTO quest_children (quest_id, child_id) VALUES (?, ?)',
      id,
      cid,
    );
  }
  return id;
}

export async function updateQuest(questId: string, input: QuestInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE quests SET title = ?, icon_emoji = ?, icon_uri = ?, reward_type = ?,
      currency_value = ?, reward_item_name = ?, frequency = ?, requires_approval = ?
     WHERE id = ?`,
    input.title,
    input.icon_emoji ?? null,
    input.icon_uri ?? null,
    input.reward_type,
    input.currency_value,
    input.reward_item_name ?? null,
    input.frequency,
    input.requires_approval ? 1 : 0,
    questId,
  );
  await db.runAsync('DELETE FROM quest_children WHERE quest_id = ?', questId);
  for (const cid of input.child_ids) {
    await db.runAsync(
      'INSERT INTO quest_children (quest_id, child_id) VALUES (?, ?)',
      questId,
      cid,
    );
  }
}

export async function duplicateQuest(questId: string): Promise<string> {
  const db = await getDb();
  const orig = await db.getFirstAsync<Quest>('SELECT * FROM quests WHERE id = ?', questId);
  if (!orig) throw new Error('Quest not found');
  const links = await db.getAllAsync<{ child_id: string }>(
    'SELECT child_id FROM quest_children WHERE quest_id = ?',
    questId,
  );
  return addQuest(orig.family_id, {
    title: `${orig.title} (copy)`,
    icon_emoji: orig.icon_emoji,
    icon_uri: orig.icon_uri,
    reward_type: orig.reward_type,
    currency_value: orig.currency_value,
    reward_item_name: orig.reward_item_name,
    frequency: orig.frequency,
    requires_approval: orig.requires_approval === 1,
    child_ids: links.map((l) => l.child_id),
  });
}

export async function deleteQuest(questId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM quests WHERE id = ?', questId);
}

// ----- Approvals -----

export async function listPendingApprovals(familyId: string): Promise<PendingApproval[]> {
  const db = await getDb();
  return db.getAllAsync<PendingApproval>(
    `SELECT
       qa.id AS assignment_id,
       q.id AS quest_id,
       q.title AS quest_title,
       q.icon_emoji AS quest_icon_emoji,
       q.icon_uri AS quest_icon_uri,
       q.reward_type AS reward_type,
       q.currency_value AS currency_value,
       q.reward_item_name AS reward_item_name,
       c.id AS child_id,
       c.name AS child_name,
       c.color AS child_color,
       qa.completed_at AS completed_at,
       qa.photo_url AS photo_url
     FROM quest_assignments qa
     JOIN quests q ON q.id = qa.quest_id
     JOIN children c ON c.id = qa.child_id
     WHERE qa.status = 'submitted' AND q.family_id = ?
     ORDER BY qa.completed_at ASC`,
    familyId,
  );
}

export async function approveAssignment(assignmentId: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    quest_id: string;
    child_id: string;
    currency_value: number;
    reward_type: RewardType;
  }>(
    `SELECT qa.quest_id, qa.child_id, q.currency_value, q.reward_type
     FROM quest_assignments qa JOIN quests q ON q.id = qa.quest_id
     WHERE qa.id = ?`,
    assignmentId,
  );
  if (!row) throw new Error('Assignment not found');
  await db.runAsync(
    `UPDATE quest_assignments SET status = 'approved', approved_at = ? WHERE id = ?`,
    Date.now(),
    assignmentId,
  );
  if (row.reward_type === 'currency') {
    await db.runAsync(
      'UPDATE children SET currency_balance = currency_balance + ? WHERE id = ?',
      row.currency_value,
      row.child_id,
    );
  }
}

export async function denyAssignment(assignmentId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE quest_assignments SET status = 'rejected', approved_at = ? WHERE id = ?`,
    Date.now(),
    assignmentId,
  );
}

// ----- Kid-side queries -----

export interface KidQuest extends Quest {
  status: 'available' | 'submitted' | 'done_today';
  assignment_id: string | null;
}

/**
 * Compute the "window start" timestamp for a given frequency.
 * Anything completed at or after this timestamp counts as "already done this period".
 */
function windowStart(frequency: QuestFrequency, now: number): number {
  const d = new Date(now);
  if (frequency === 'once') return 0;
  if (frequency === 'daily') {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (frequency === 'weekly') {
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (frequency === 'monthly') {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  return 0;
}

/**
 * List the quests that are currently actionable for a child:
 * - Assigned to this child
 * - Not already completed (in pending/submitted/approved state) in the current frequency window
 *
 * Also returns the latest assignment id and its status if one exists in the current window.
 */
export async function listKidQuests(childId: string): Promise<KidQuest[]> {
  const db = await getDb();
  const now = Date.now();
  const quests = await db.getAllAsync<Quest>(
    `SELECT q.* FROM quests q
     JOIN quest_children qc ON qc.quest_id = q.id
     WHERE qc.child_id = ? AND q.is_active = 1
     ORDER BY q.created_at DESC`,
    childId,
  );

  const result: KidQuest[] = [];
  for (const q of quests) {
    const since = windowStart(q.frequency, now);
    const latest = await db.getFirstAsync<{
      id: string;
      status: AssignmentStatus;
      completed_at: number | null;
    }>(
      `SELECT id, status, completed_at FROM quest_assignments
       WHERE quest_id = ? AND child_id = ?
         AND (completed_at IS NULL OR completed_at >= ?)
         AND status != 'rejected'
       ORDER BY COALESCE(completed_at, 0) DESC LIMIT 1`,
      q.id,
      childId,
      since,
    );

    if (!latest) {
      result.push({ ...q, status: 'available', assignment_id: null });
    } else if (latest.status === 'submitted') {
      result.push({ ...q, status: 'submitted', assignment_id: latest.id });
    } else if (latest.status === 'approved') {
      // already done this window
      result.push({ ...q, status: 'done_today', assignment_id: latest.id });
    } else {
      // 'pending' shouldn't really happen with current flow; treat as available
      result.push({ ...q, status: 'available', assignment_id: latest.id });
    }
  }
  return result;
}

export interface MarkDoneResult {
  awarded: boolean;
  currency_delta: number;
  assignment_id: string;
}

/**
 * Mark a quest done for a child.
 * - If quest.requires_approval=true → creates a 'submitted' assignment, no currency yet
 * - If quest.requires_approval=false → creates an 'approved' assignment and awards currency immediately
 */
export async function markQuestDone(
  questId: string,
  childId: string,
): Promise<MarkDoneResult> {
  const db = await getDb();
  const quest = await db.getFirstAsync<Quest>(
    'SELECT * FROM quests WHERE id = ?',
    questId,
  );
  if (!quest) throw new Error('Quest not found');

  const id = uuid();
  const now = Date.now();
  const isInstant = quest.requires_approval === 0;
  const status: AssignmentStatus = isInstant ? 'approved' : 'submitted';
  let awarded = false;
  let delta = 0;

  await db.runAsync(
    `INSERT INTO quest_assignments (id, quest_id, child_id, due_date, status, photo_url, completed_at, approved_at)
     VALUES (?, ?, ?, NULL, ?, NULL, ?, ?)`,
    id,
    questId,
    childId,
    status,
    now,
    isInstant ? now : null,
  );

  if (isInstant && quest.reward_type === 'currency') {
    await db.runAsync(
      'UPDATE children SET currency_balance = currency_balance + ? WHERE id = ?',
      quest.currency_value,
      childId,
    );
    awarded = true;
    delta = quest.currency_value;
  }

  return { awarded, currency_delta: delta, assignment_id: id };
}

// ----- Rewards -----

export type RedemptionMode = 'instant' | 'approval';
export type RedemptionStatus = 'pending' | 'approved' | 'rejected';

export interface Reward {
  id: string;
  family_id: string;
  title: string;
  icon_emoji: string | null;
  icon_uri: string | null;
  currency_cost: number;
  redemption_mode: RedemptionMode;
  real_money_value_cents: number | null;
  is_active: number;
  created_at: number;
}

export interface RewardInput {
  title: string;
  icon_emoji?: string | null;
  icon_uri?: string | null;
  currency_cost: number;
  redemption_mode: RedemptionMode;
  real_money_value_cents?: number | null;
}

export async function listRewards(familyId: string): Promise<Reward[]> {
  const db = await getDb();
  return db.getAllAsync<Reward>(
    'SELECT * FROM rewards WHERE family_id = ? AND is_active = 1 ORDER BY created_at DESC',
    familyId,
  );
}

export async function addReward(familyId: string, input: RewardInput): Promise<string> {
  const db = await getDb();
  const id = uuid();
  await db.runAsync(
    `INSERT INTO rewards (id, family_id, title, icon_emoji, icon_uri, currency_cost,
      redemption_mode, real_money_value_cents, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    id,
    familyId,
    input.title,
    input.icon_emoji ?? null,
    input.icon_uri ?? null,
    input.currency_cost,
    input.redemption_mode,
    input.real_money_value_cents ?? null,
    Date.now(),
  );
  return id;
}

export async function updateReward(rewardId: string, input: RewardInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE rewards SET title = ?, icon_emoji = ?, icon_uri = ?, currency_cost = ?,
      redemption_mode = ?, real_money_value_cents = ?
     WHERE id = ?`,
    input.title,
    input.icon_emoji ?? null,
    input.icon_uri ?? null,
    input.currency_cost,
    input.redemption_mode,
    input.real_money_value_cents ?? null,
    rewardId,
  );
}

export async function deleteReward(rewardId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM rewards WHERE id = ?', rewardId);
}

// ----- Redemptions -----

export interface RedemptionResult {
  instant: boolean;
  redemption_id: string;
  new_balance: number;
}

/**
 * Kid requests a reward. Always deducts currency immediately
 * (refunded if a pending approval is denied). Status depends on reward.redemption_mode.
 */
export async function requestRedemption(
  rewardId: string,
  childId: string,
): Promise<RedemptionResult> {
  const db = await getDb();
  const reward = await db.getFirstAsync<Reward>(
    'SELECT * FROM rewards WHERE id = ?',
    rewardId,
  );
  if (!reward) throw new Error('Reward not found');
  const child = await db.getFirstAsync<Child>(
    'SELECT * FROM children WHERE id = ?',
    childId,
  );
  if (!child) throw new Error('Child not found');
  if (child.currency_balance < reward.currency_cost) {
    throw new Error('Not enough currency');
  }

  const id = uuid();
  const isInstant = reward.redemption_mode === 'instant';
  const status: RedemptionStatus = isInstant ? 'approved' : 'pending';
  let newBalance = child.currency_balance;

  await db.runAsync(
    'UPDATE children SET currency_balance = currency_balance - ? WHERE id = ?',
    reward.currency_cost,
    childId,
  );
  newBalance = child.currency_balance - reward.currency_cost;
  await db.runAsync(
    'INSERT INTO redemptions (id, reward_id, child_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
    id,
    rewardId,
    childId,
    status,
    Date.now(),
  );

  return { instant: isInstant, redemption_id: id, new_balance: newBalance };
}

export async function approveRedemption(redemptionId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE redemptions SET status = 'approved' WHERE id = ? AND status = 'pending'`,
    redemptionId,
  );
}

export async function denyRedemption(redemptionId: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    reward_id: string;
    child_id: string;
    currency_cost: number;
  }>(
    `SELECT r.id AS reward_id, r.child_id AS child_id, w.currency_cost AS currency_cost
     FROM redemptions r JOIN rewards w ON w.id = r.reward_id
     WHERE r.id = ? AND r.status = 'pending'`,
    redemptionId,
  );
  if (!row) return;
  await db.runAsync(
    `UPDATE redemptions SET status = 'rejected' WHERE id = ?`,
    redemptionId,
  );
  await db.runAsync(
    'UPDATE children SET currency_balance = currency_balance + ? WHERE id = ?',
    row.currency_cost,
    row.child_id,
  );
}

export interface PendingRedemptionApproval {
  redemption_id: string;
  reward_id: string;
  reward_title: string;
  reward_icon_emoji: string | null;
  reward_icon_uri: string | null;
  currency_cost: number;
  child_id: string;
  child_name: string;
  child_color: string;
  created_at: number;
}

export async function listPendingRedemptionApprovals(
  familyId: string,
): Promise<PendingRedemptionApproval[]> {
  const db = await getDb();
  return db.getAllAsync<PendingRedemptionApproval>(
    `SELECT
       r.id AS redemption_id,
       w.id AS reward_id,
       w.title AS reward_title,
       w.icon_emoji AS reward_icon_emoji,
       w.icon_uri AS reward_icon_uri,
       w.currency_cost AS currency_cost,
       c.id AS child_id,
       c.name AS child_name,
       c.color AS child_color,
       r.created_at AS created_at
     FROM redemptions r
     JOIN rewards w ON w.id = r.reward_id
     JOIN children c ON c.id = r.child_id
     WHERE r.status = 'pending' AND w.family_id = ?
     ORDER BY r.created_at ASC`,
    familyId,
  );
}

export interface KidPendingRedemption {
  redemption_id: string;
  reward_title: string;
  reward_icon_emoji: string | null;
  reward_icon_uri: string | null;
  currency_cost: number;
  created_at: number;
}

export async function listKidPendingRedemptions(
  childId: string,
): Promise<KidPendingRedemption[]> {
  const db = await getDb();
  return db.getAllAsync<KidPendingRedemption>(
    `SELECT
       r.id AS redemption_id,
       w.title AS reward_title,
       w.icon_emoji AS reward_icon_emoji,
       w.icon_uri AS reward_icon_uri,
       w.currency_cost AS currency_cost,
       r.created_at AS created_at
     FROM redemptions r
     JOIN rewards w ON w.id = r.reward_id
     WHERE r.status = 'pending' AND r.child_id = ?
     ORDER BY r.created_at ASC`,
    childId,
  );
}
