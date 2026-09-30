import type { EntryRepository } from '@/data';
import type { Entry } from '@/domain';
import { EntryEditor } from '../components/EntryEditor';
import { useEntryEditor } from '../hooks/useEntryEditor';

interface EntryEditorContainerProps {
  entry: Entry;
  repo: Pick<EntryRepository, 'update'>;
  onDone: () => void;
  onDelete: (entry: Entry) => void;
}

export function EntryEditorContainer({ entry, repo, onDone, onDelete }: EntryEditorContainerProps) {
  const editor = useEntryEditor(entry, repo, onDone);
  return (
    <EntryEditor
      {...editor}
      onSave={() => {
        void editor.onSave();
      }}
      onDelete={() => {
        onDelete(entry);
      }}
    />
  );
}
