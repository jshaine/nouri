import {
  ESTIMATE_NOTE,
  FLOOR_MESSAGE,
  MACRO_PRESETS,
  formatNumber,
  type CalculatorResult,
  type PresetId,
} from '@/domain';
import { Button, MacroLabel, SelectField } from '@/ui';
import styles from './SuggestionCard.module.css';

export type SuggestionState =
  | { kind: 'missing'; missing: string[] }
  | { kind: 'blocked'; message: string }
  | { kind: 'ready'; result: CalculatorResult; steps: string[]; matchesCurrent: boolean };

export interface SuggestionCardProps {
  state: SuggestionState;
  preset: PresetId;
  onPreset: (id: PresetId) => void;
  onApply: () => void;
  applying?: boolean;
  message?: { kind: 'saved' | 'failed'; text: string } | undefined;
}

const PRESET_OPTIONS = MACRO_PRESETS.map((p) => ({
  value: p.id,
  label: `${p.label} (${p.percents.p}P / ${p.percents.c}C / ${p.percents.f}F)`,
}));

function list(items: string[]): string {
  return items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;
}

/** The calculator's suggestion, shown step by step, applied only when you choose. */
export function SuggestionCard({
  state,
  preset,
  onPreset,
  onApply,
  applying = false,
  message,
}: SuggestionCardProps) {
  if (state.kind === 'missing') {
    return <p className={styles.muted}>Add your {list(state.missing)} to see suggested goals.</p>;
  }
  if (state.kind === 'blocked') return <p className={styles.muted}>{state.message}</p>;
  const { result, steps, matchesCurrent } = state;
  const sign = result.adjustment > 0 ? '+' : result.adjustment < 0 ? '−' : '';
  return (
    <div className={styles.card}>
      <dl className={styles.stats}>
        <div>
          <dt>BMR</dt>
          <dd>{formatNumber(result.bmr)} kcal</dd>
        </div>
        <div>
          <dt>Maintenance</dt>
          <dd>{formatNumber(result.maintenance)} kcal</dd>
        </div>
        <div>
          <dt>Weekly goal</dt>
          <dd>
            {sign}
            {formatNumber(Math.abs(result.adjustment))} kcal
          </dd>
        </div>
        <div className={styles.total}>
          <dt>Daily goal</dt>
          <dd>{formatNumber(result.goal.kcal)} kcal</dd>
        </div>
      </dl>
      {result.floored && (
        <p className={styles.floor} role="note">
          {FLOOR_MESSAGE}
        </p>
      )}
      <SelectField
        label="Macro split"
        options={PRESET_OPTIONS}
        value={preset === 'custom' ? 'default' : preset}
        onChange={(v) => {
          onPreset(v as PresetId);
        }}
      />
      <ul className={styles.macros} aria-label="Macro targets">
        <li>
          <MacroLabel macro="protein" /> {result.goal.p} g
        </li>
        <li>
          <MacroLabel macro="carbs" /> {result.goal.c} g
        </li>
        <li>
          <MacroLabel macro="fat" /> {result.goal.f} g
        </li>
      </ul>
      <details className={styles.details}>
        <summary>How this is calculated</summary>
        <ol>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </details>
      <p className={styles.muted}>{ESTIMATE_NOTE}</p>
      {message && (
        <p
          className={message.kind === 'failed' ? styles.error : styles.saved}
          role={message.kind === 'failed' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
      {matchesCurrent && !message ? (
        <p className={styles.saved}>Your goals match this suggestion.</p>
      ) : (
        <Button variant="primary" block disabled={applying} onClick={onApply}>
          {applying ? 'Saving…' : 'Use these goals'}
        </Button>
      )}
    </div>
  );
}
