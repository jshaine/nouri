import type { SyntheticEvent } from 'react';
import type { GoalFormErrors, GoalFormInput, MacroPercents, PresetId } from '@/domain';
import { Button, NumberField, SegmentedControl } from '@/ui';
import { GramFields } from './GramFields';
import { PercentFields } from './PercentFields';
import styles from './GoalEditor.module.css';

const MODES = [
  { value: 'percent', label: '% of calories' },
  { value: 'grams', label: 'Grams' },
] as const;

export interface GoalEditorProps {
  value: GoalFormInput;
  errors: GoalFormErrors;
  preset: PresetId;
  gramsPreview: MacroPercents | undefined;
  kcalPreview: number | undefined;
  onMode: (mode: GoalFormInput['mode']) => void;
  onField: (field: 'kcal' | 'p' | 'c' | 'f', value: string) => void;
  onPreset: (id: PresetId) => void;
  onPercent: (key: keyof MacroPercents, value: number) => void;
  onSubmit: () => void;
  saving?: boolean;
  /** Confirmation or failure after saving. */
  message?: { kind: 'saved' | 'failed'; text: string } | undefined;
}

export function GoalEditor(props: GoalEditorProps) {
  const { value, errors, saving = false, message } = props;
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.onSubmit();
  };
  return (
    <form className={styles.editor} noValidate onSubmit={submit}>
      <SegmentedControl
        label="Set macros by"
        options={MODES}
        value={value.mode}
        onChange={props.onMode}
      />
      {value.mode === 'percent' ? (
        <>
          <NumberField
            label="Daily calories"
            unit="kcal"
            inputMode="numeric"
            value={value.kcal}
            error={errors.kcal}
            onChange={(v) => {
              props.onField('kcal', v);
            }}
          />
          <PercentFields
            percents={value.percents}
            preset={props.preset}
            onPreset={props.onPreset}
            onPercent={props.onPercent}
            grams={props.gramsPreview}
            error={errors.percents}
          />
        </>
      ) : (
        <GramFields
          value={value}
          errors={errors}
          onChange={props.onField}
          kcal={props.kcalPreview}
        />
      )}
      <p className={styles.note}>New goals apply from today. Past days keep the goals they had.</p>
      {message && (
        <p
          className={message.kind === 'failed' ? styles.error : styles.saved}
          role={message.kind === 'failed' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" variant="primary" block disabled={saving}>
        {saving ? 'Saving…' : 'Save goals'}
      </Button>
    </form>
  );
}
