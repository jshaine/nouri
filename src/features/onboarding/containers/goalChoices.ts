import { WEEKLY_GOALS, type UnitSystem, type WeeklyGoal } from '@/domain';
import { paceLabel } from '@/features/profile';

export type Direction = 'lose' | 'maintain' | 'gain';

export const DIRECTION_OPTIONS = [
  { value: 'lose', label: 'Lose weight', description: 'Eat a little less than you burn.' },
  { value: 'maintain', label: 'Maintain my weight', description: 'Eat about what you burn.' },
  { value: 'gain', label: 'Gain weight', description: 'Eat a little more than you burn.' },
] as const;

/** The pace picked for you when you choose a direction; you can change it. */
export const DEFAULT_PACE: Readonly<Record<Direction, WeeklyGoal>> = {
  lose: -0.5,
  maintain: 0,
  gain: 0.25,
};

const PACE_NOTE: Partial<Record<WeeklyGoal, string>> = {
  [-1]: 'Fastest, and the hardest to keep up.',
  [-0.75]: 'Faster.',
  [-0.5]: 'Recommended for most people.',
  [-0.25]: 'Slow and steady.',
  [0.25]: 'Recommended: less fat gained.',
  [0.5]: 'Faster.',
};

export function directionOf(kg: WeeklyGoal | undefined): Direction | undefined {
  if (kg === undefined) return undefined;
  return kg === 0 ? 'maintain' : kg < 0 ? 'lose' : 'gain';
}

export function paceOptions(direction: Direction, units: UnitSystem) {
  return WEEKLY_GOALS.filter((kg) => directionOf(kg) === direction)
    .sort((a, b) => Math.abs(a) - Math.abs(b))
    .map((kg) => ({
      value: String(kg),
      label: paceLabel(kg, units),
      description: PACE_NOTE[kg],
    }));
}
