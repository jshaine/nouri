import { useId } from 'react';
import { Button } from '@/ui';
import styles from './CustomFoodForm.module.css';

interface DeleteFoodConfirmProps {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting?: boolean;
  error?: string | undefined;
}

/** Deleting a food never changes past days, so say so plainly. */
export function DeleteFoodConfirm({
  name,
  onCancel,
  onConfirm,
  deleting = false,
  error,
}: DeleteFoodConfirmProps) {
  const titleId = useId();
  return (
    <div className={styles.confirm} role="group" aria-labelledby={titleId}>
      <p id={titleId} className={styles.confirmTitle}>
        Delete “{name}”?
      </p>
      <p className={styles.confirmBody}>
        It leaves My foods and search. Days you already logged it keep their numbers.
      </p>
      {error && (
        <p className={styles.saveError} role="alert">
          {error}
        </p>
      )}
      <div className={styles.confirmActions}>
        <Button variant="ghost" onClick={onCancel}>
          Keep it
        </Button>
        <Button onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete food'}
        </Button>
      </div>
    </div>
  );
}
