import type { Entry } from '@/domain';
import { EntryRow } from '../components/EntryRow';
import { useLongPress } from '../hooks/useLongPress';

interface EntryRowContainerProps {
  entry: Entry;
  onOpen: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

/** Tap to edit; long-press to delete (undo is offered). */
export function EntryRowContainer({ entry, onOpen, onDelete }: EntryRowContainerProps) {
  const press = useLongPress(
    () => {
      onDelete(entry);
    },
    () => {
      onOpen(entry);
    },
  );
  return (
    <EntryRow
      entry={entry}
      press={{ ...press, 'aria-description': 'Tap to edit. Press and hold to delete.' }}
    />
  );
}
