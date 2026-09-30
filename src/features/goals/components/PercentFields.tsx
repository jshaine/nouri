import {
  MACRO_PRESETS,
  MACROS,
  PERCENT_STEP,
  percentTotal,
  type Macro,
  type MacroPercents,
  type PresetId,
} from '@/domain';
import { MacroLabel, SelectField, Stepper } from '@/ui';
import styles from './GoalEditor.module.css';

const KEY: Record<Macro, keyof MacroPercents> = { protein: 'p', carbs: 'c', fat: 'f' };
const PRESET_OPTIONS = [
  ...MACRO_PRESETS.map((p) => ({
    value: p.id,
    label: `${p.label} (${p.percents.p}P / ${p.percents.c}C / ${p.percents.f}F)`,
  })),
  { value: 'custom', label: 'Custom' },
];

interface PercentFieldsProps {
  percents: MacroPercents;
  preset: PresetId;
  onPreset: (id: PresetId) => void;
  onPercent: (key: keyof MacroPercents, value: number) => void;
  /** Grams each percent works out to, when calories are valid. */
  grams: MacroPercents | undefined;
  error?: string | undefined;
}

/** Macro split as % of calories, in 5% steps that must total 100. */
export function PercentFields({
  percents,
  preset,
  onPreset,
  onPercent,
  grams,
  error,
}: PercentFieldsProps) {
  const total = percentTotal(percents);
  return (
    <div className={styles.group}>
      <SelectField
        label="Macro split"
        options={PRESET_OPTIONS}
        value={preset}
        onChange={(v) => {
          onPreset(v as PresetId);
        }}
      />
      <ul className={styles.percents}>
        {MACROS.map((m) => (
          <li key={m} className={styles.percentRow}>
            <MacroLabel macro={m} />
            <Stepper
              label={`${m} percent`}
              value={percents[KEY[m]]}
              step={PERCENT_STEP}
              min={0}
              max={100}
              onChange={(v) => {
                onPercent(KEY[m], v);
              }}
            />
            <span className={styles.grams}>{grams ? `${grams[KEY[m]]} g` : '–'}</span>
          </li>
        ))}
      </ul>
      <p className={styles.total} data-ok={total === 100 ? 'true' : undefined} aria-live="polite">
        Total {total}%{total === 100 ? '' : ' (needs 100%)'}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
