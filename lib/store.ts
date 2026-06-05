import { create } from 'zustand';
import * as db from './db';

interface AppState {
  family: db.Family | null;
  children: db.Child[];
  quests: db.QuestWithChildren[];
  approvals: db.PendingApproval[];
  parentUnlocked: boolean;
  initialized: boolean;

  bootstrap: () => Promise<void>;
  setFamily: (family: db.Family) => void;
  refreshChildren: () => Promise<void>;
  refreshQuests: () => Promise<void>;
  refreshApprovals: () => Promise<void>;
  refreshAll: () => Promise<void>;
  unlockParent: () => void;
  lockParent: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  family: null,
  children: [],
  quests: [],
  approvals: [],
  parentUnlocked: false,
  initialized: false,

  bootstrap: async () => {
    const family = await db.getFamily();
    if (family) {
      const [children, quests, approvals] = await Promise.all([
        db.listChildren(family.id),
        db.listQuests(family.id),
        db.listPendingApprovals(family.id),
      ]);
      set({ family, children, quests, approvals, initialized: true });
    } else {
      set({ initialized: true });
    }
  },

  setFamily: (family) => set({ family }),

  refreshChildren: async () => {
    const { family } = get();
    if (!family) return;
    const children = await db.listChildren(family.id);
    set({ children });
  },

  refreshQuests: async () => {
    const { family } = get();
    if (!family) return;
    const quests = await db.listQuests(family.id);
    set({ quests });
  },

  refreshApprovals: async () => {
    const { family } = get();
    if (!family) return;
    const approvals = await db.listPendingApprovals(family.id);
    set({ approvals });
  },

  refreshAll: async () => {
    const { family } = get();
    if (!family) return;
    const [children, quests, approvals] = await Promise.all([
      db.listChildren(family.id),
      db.listQuests(family.id),
      db.listPendingApprovals(family.id),
    ]);
    set({ children, quests, approvals });
  },

  unlockParent: () => set({ parentUnlocked: true }),
  lockParent: () => set({ parentUnlocked: false }),
}));
