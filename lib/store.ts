import { create } from 'zustand';
import * as db from './db';

interface AppState {
  family: db.Family | null;
  children: db.Child[];
  quests: db.QuestWithChildren[];
  rewards: db.Reward[];
  approvals: db.PendingApproval[];
  redemptionApprovals: db.PendingRedemptionApproval[];
  parentUnlocked: boolean;
  initialized: boolean;

  bootstrap: () => Promise<void>;
  setFamily: (family: db.Family) => void;
  refreshChildren: () => Promise<void>;
  refreshQuests: () => Promise<void>;
  refreshRewards: () => Promise<void>;
  refreshApprovals: () => Promise<void>;
  refreshAll: () => Promise<void>;
  unlockParent: () => void;
  lockParent: () => void;
}

async function loadAll(familyId: string) {
  const [children, quests, rewards, approvals, redemptionApprovals] = await Promise.all([
    db.listChildren(familyId),
    db.listQuests(familyId),
    db.listRewards(familyId),
    db.listPendingApprovals(familyId),
    db.listPendingRedemptionApprovals(familyId),
  ]);
  return { children, quests, rewards, approvals, redemptionApprovals };
}

export const useAppStore = create<AppState>((set, get) => ({
  family: null,
  children: [],
  quests: [],
  rewards: [],
  approvals: [],
  redemptionApprovals: [],
  parentUnlocked: false,
  initialized: false,

  bootstrap: async () => {
    const family = await db.getFamily();
    if (family) {
      const data = await loadAll(family.id);
      set({ family, ...data, initialized: true });
    } else {
      set({ initialized: true });
    }
  },

  setFamily: (family) => set({ family }),

  refreshChildren: async () => {
    const { family } = get();
    if (!family) return;
    set({ children: await db.listChildren(family.id) });
  },

  refreshQuests: async () => {
    const { family } = get();
    if (!family) return;
    set({ quests: await db.listQuests(family.id) });
  },

  refreshRewards: async () => {
    const { family } = get();
    if (!family) return;
    set({ rewards: await db.listRewards(family.id) });
  },

  refreshApprovals: async () => {
    const { family } = get();
    if (!family) return;
    const [approvals, redemptionApprovals] = await Promise.all([
      db.listPendingApprovals(family.id),
      db.listPendingRedemptionApprovals(family.id),
    ]);
    set({ approvals, redemptionApprovals });
  },

  refreshAll: async () => {
    const { family } = get();
    if (!family) return;
    const data = await loadAll(family.id);
    set(data);
  },

  unlockParent: () => set({ parentUnlocked: true }),
  lockParent: () => set({ parentUnlocked: false }),
}));
