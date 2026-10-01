import type { UnitSystem } from '@/domain';
import { NumberField } from '@/ui';
import styles from './Profile.module.css';

export interface HeightDrafts {
  cm: string;
  ft: string;
  in: string;
}

interface HeightFieldProps {
  units: UnitSystem;
  drafts: HeightDrafts;
  error?: string | undefined;
  onEdit: (field: keyof HeightDrafts, value: string) => void;
  onBlur?: () => void;
}

/** Height in cm, or feet and inches. */
export function HeightField({ units, drafts, error, onEdit, onBlur }: HeightFieldProps) {
  if (units === 'metric') {
    return (
      <NumberField
        label="Height"
        unit="cm"
        value={drafts.cm}
        error={error}
        onChange={(v) => {
          onEdit('cm', v);
        }}
        onBlur={onBlur}
      />
    );
  }
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Height</legend>
      <div className={styles.pair}>
        <NumberField
          label="Feet"
          unit="ft"
          inputMode="numeric"
          value={drafts.ft}
          onChange={(v) => {
            onEdit('ft', v);
          }}
          onBlur={onBlur}
        />
        <NumberField
          label="Inches"
          unit="in"
          value={drafts.in}
          error={error}
          onChange={(v) => {
            onEdit('in', v);
          }}
          onBlur={onBlur}
        />
      </div>
    </fieldset>
  );
}
