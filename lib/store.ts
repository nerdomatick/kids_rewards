import { create } from 'zustand';
import * as db from './db';

interface AppState {
  family: db.Family | null;
  children: db.Child[];
  parentUnlocked: boolean;
  initialized: boolean;

  bootstrap: () => Promise<void>;
  setFamily: (family: db.Family) => void;
  refreshChildren: () => Promise<void>;
  unlockParent: () => void;
  lockParent: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  family: null,
  children: [],
  parentUnlocked: false,
  initialized: false,

  bootstrap: async () => {
    const family = await db.getFamily();
    if (family) {
      const children = await db.listChildren(family.id);
      set({ family, children, initialized: true });
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

  unlockParent: () => set({ parentUnlocked: true }),
  lockParent: () => set({ parentUnlocked: false }),
}));
