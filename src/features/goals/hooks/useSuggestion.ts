import { useState } from 'react';
import type { GoalRepository } from '@/data';
import {
  calculateGoals,
  calculatorInputFrom,
  explainCalculation,
  formatWeight,
  goalForDate,
  MACRO_PRESETS,
  MINOR_MESSAGE,
  MISSING_LABEL,
  presetFor,
  type GoalRecord,
  type LocalDate,
  type MacroPercents,
  type PresetId,
  type Profile,
} from '@/domain';
import type { SuggestionState } from '../components/SuggestionCard';

export const APPLY_FAILED =
  'Couldn’t save your goals. Check that your browser allows this site to store data, then try again.';

const DEFAULT_SPLIT = MACRO_PRESETS[0].percents;

/** The calculator's suggestion for today, and applying it as a new goal record. */
export function useSuggestion(
  profile: Profile,
  currentKg: number | undefined,
  goals: readonly GoalRecord[],
  repo: Pick<GoalRepository, 'setFrom'>,
  today: LocalDate,
) {
  const current = goalForDate(goals, today);
  const [percents, setPercents] = useState<MacroPercents>(
    current?.macroMode === 'percent' ? current.percents : DEFAULT_SPLIT,
  );
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ kind: 'saved' | 'failed'; text: string }>();

  const inputs = calculatorInputFrom(profile, currentKg, today, percents);
  let state: SuggestionState;
  if (!inputs.ok) {
    state = { kind: 'missing', missing: inputs.missing.map((m) => MISSING_LABEL[m]) };
  } else {
    const calc = calculateGoals(inputs.input);
    if (calc.ok) {
      const g = calc.result.goal;
      state = {
        kind: 'ready',
        result: calc.result,
        steps: explainCalculation(inputs.input, calc.result),
        matchesCurrent:
          current?.kcal === g.kcal && current.p === g.p && current.c === g.c && current.f === g.f,
      };
    } else if (calc.problem.kind === 'minor') {
      state = { kind: 'blocked', message: MINOR_MESSAGE };
    } else if (calc.problem.kind === 'goal-below-healthy') {
      state = {
        kind: 'blocked',
        message: `Your goal weight is below a healthy weight for your height. The lowest goal we can plan for is ${formatWeight(calc.problem.minimumKg, profile.units)} (a BMI of 18.5).`,
      };
    } else {
      state = {
        kind: 'blocked',
        message: 'Pick a weekly goal that moves toward your goal weight.',
      };
    }
  }

  return {
    state,
    preset: presetFor(percents),
    applying,
    message,
    onPreset: (id: PresetId) => {
      const p = MACRO_PRESETS.find((x) => x.id === id);
      if (p) setPercents({ ...p.percents });
      setMessage(undefined);
    },
    async onApply() {
      if (state.kind !== 'ready') return;
      setApplying(true);
      try {
        await repo.setFrom(today, { ...state.result.goal, macroMode: 'percent', percents });
        setMessage({
          kind: 'saved',
          text: 'Goals updated. They apply from today; past days keep theirs.',
        });
      } catch {
        setMessage({ kind: 'failed', text: APPLY_FAILED });
      } finally {
        setApplying(false);
      }
    },
  };
}
