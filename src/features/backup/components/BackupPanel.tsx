import { Download, Upload } from 'lucide-react';
import { useId, type ChangeEvent } from 'react';
import { Button } from '@/ui';
import styles from './BackupPanel.module.css';

/** What a checked backup file contains (from the container). */
export interface BackupSummary {
  counts: { entries: number; customFoods: number; weights: number; goals: number };
  skipped: number;
}

export interface BackupPanelProps {
  lastBackup: string | undefined;
  busy: boolean;
  checked?: BackupSummary | undefined;
  confirmingReplace: boolean;
  message?: { kind: 'ok' | 'error'; text: string } | undefined;
  onExport: () => void;
  onFile: (file: File) => void;
  onMerge: () => void;
  onAskReplace: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

function describe(c: BackupSummary): string {
  const n = c.counts;
  const parts = [
    `${n.entries} ${n.entries === 1 ? 'entry' : 'entries'}`,
    `${n.customFoods} ${n.customFoods === 1 ? 'food' : 'foods'}`,
    `${n.weights} ${n.weights === 1 ? 'weigh-in' : 'weigh-ins'}`,
    `${n.goals} ${n.goals === 1 ? 'goal' : 'goals'}`,
  ];
  return parts.join(', ');
}

/** Back up to a file, and restore from one with a merge-or-replace choice. */
export function BackupPanel(props: BackupPanelProps) {
  const fileId = useId();
  const { checked, message, busy } = props;
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) props.onFile(file);
  };
  return (
    <div className={styles.panel}>
      <p className={styles.muted}>
        {props.lastBackup ? `Last backup: ${props.lastBackup}.` : 'No backup yet.'} Your data lives
        only on this phone, so a backup file is your copy.
      </p>
      <div className={styles.row}>
        <Button variant="primary" icon={Download} onClick={props.onExport} disabled={busy}>
          Back up
        </Button>
        <label htmlFor={fileId} className={styles.fileButton}>
          <Upload aria-hidden="true" className={styles.icon} />
          Restore from a backup
        </label>
        <input
          id={fileId}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={pick}
          disabled={busy}
        />
      </div>
      {checked && !props.confirmingReplace && (
        <div className={styles.choice} role="group" aria-label="Restore options">
          <p>
            This backup has {describe(checked)}.
            {checked.skipped > 0 &&
              ` ${checked.skipped} item${checked.skipped === 1 ? '' : 's'} couldn’t be read and will be left out.`}
          </p>
          <Button onClick={props.onMerge} disabled={busy}>
            Merge: add what’s missing
          </Button>
          <Button variant="ghost" onClick={props.onAskReplace} disabled={busy}>
            Replace everything
          </Button>
          <Button variant="ghost" onClick={props.onCancel}>
            Cancel
          </Button>
        </div>
      )}
      {checked && props.confirmingReplace && (
        <div className={styles.choice} role="group" aria-label="Confirm replace">
          <p>
            <b>Replace everything on this phone?</b> Your current log, foods, goals and weigh-ins
            will be replaced by the backup’s.
          </p>
          <Button onClick={props.onReplace} disabled={busy}>
            Yes, replace
          </Button>
          <Button variant="ghost" onClick={props.onCancel}>
            Keep my data
          </Button>
        </div>
      )}
      {message && (
        <p
          className={message.kind === 'error' ? styles.error : styles.ok}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
