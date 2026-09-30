import { useState } from 'react';
import {
  ensurePersistentStorage,
  type EntryRepository,
  type SettingsRepository,
  type UsageRepository,
} from '@/data';
import { MEAL_NAME, type Entry } from '@/domain';

export interface ToastMessage {
  id: number;
  message: string;
  undo?: () => void;
}

interface Repos {
  entries: Pick<EntryRepository, 'remove' | 'restore'>;
  settings: Pick<SettingsRepository, 'get' | 'set'>;
  usage: Pick<UsageRepository, 'recordUse'>;
}

/** Add / edit / delete-with-undo flow for the Today screen. */
export function useLogActions(repos: Repos) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Entry>();
  const [toast, setToast] = useState<ToastMessage>();

  const show = (message: string, undo?: () => void) => {
    setToast({ id: Date.now(), message, ...(undo ? { undo } : {}) });
  };

  const remove = async (entry: Entry) => {
    setEditing(undefined);
    try {
      const removed = await repos.entries.remove(entry.id);
      if (!removed) return;
      show(`Removed ${removed.name}`, () => {
        void repos.entries.restore(removed).then(
          () => {
            show(`Restored ${removed.name}`);
          },
          () => {
            show('Couldn’t restore it. Add it again from Add food.');
          },
        );
      });
    } catch {
      show('Couldn’t delete it. Try again.');
    }
  };

  return {
    adding,
    openAdd: () => {
      setAdding(true);
    },
    closeAdd: () => {
      setAdding(false);
    },
    onAdded: (entry: Entry) => {
      setAdding(false);
      show(`Added to ${MEAL_NAME[entry.meal]}`);
      void repos.usage.recordUse(entry.foodKey);
      // Ask the browser to keep our data once there's something worth keeping.
      void ensurePersistentStorage(repos.settings);
    },
    editing,
    openEdit: setEditing,
    closeEdit: () => {
      setEditing(undefined);
    },
    remove: (entry: Entry) => {
      void remove(entry);
    },
    toast,
    dismissToast: () => {
      setToast(undefined);
    },
  };
}
