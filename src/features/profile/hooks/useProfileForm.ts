import { useState } from 'react';
import type { ProfileRepository } from '@/data';
import {
  cmToFeetInches,
  formatWeight,
  kgToLb,
  minimumGoalWeightKg,
  parseBirthDate,
  parseBodyWeight,
  parseHeight,
  weeklyGoalOptions,
  type LocalDate,
  type Profile,
  type WeeklyGoal,
} from '@/domain';

export type ProfileField = 'birthDate' | 'height' | 'goalWeight';

const oneDecimal = (n: number) => String(Math.round(n * 10) / 10);

function draftsFrom(p: Profile) {
  const ftIn = p.heightCm === undefined ? undefined : cmToFeetInches(p.heightCm);
  return {
    birthDate: p.birthDate ?? '',
    cm: p.heightCm === undefined ? '' : oneDecimal(p.heightCm),
    ft: ftIn ? String(ftIn.feet) : '',
    in: ftIn ? String(ftIn.inches) : '',
    goalWeight:
      p.goalWeightKg === undefined
        ? ''
        : oneDecimal(p.units === 'metric' ? p.goalWeightKg : kgToLb(p.goalWeightKg)),
  };
}

/**
 * Profile editing. Choices save at once; typed fields save when you leave
 * them (so half-typed numbers aren't stored) and show what to fix otherwise.
 */
export function useProfileForm(
  profile: Profile,
  repo: Pick<ProfileRepository, 'update'>,
  currentKg: number | undefined,
  today: LocalDate,
) {
  const [drafts, setDrafts] = useState(() => draftsFrom(profile));
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const save = (patch: Partial<Profile>) => {
    void repo.update(patch);
  };
  const fail = (field: ProfileField, error?: string) => {
    setErrors((e) => ({ ...e, [field]: error }));
  };

  const paces: WeeklyGoal[] =
    currentKg !== undefined && profile.goalWeightKg !== undefined
      ? weeklyGoalOptions(currentKg, profile.goalWeightKg)
      : [0];

  return {
    drafts,
    errors,
    paces,
    edit: (field: keyof ReturnType<typeof draftsFrom>, value: string) => {
      setDrafts((d) => ({ ...d, [field]: value }));
    },
    commit(field: ProfileField) {
      if (field === 'birthDate') {
        const r = parseBirthDate(drafts.birthDate, today);
        fail(field, r.ok ? undefined : r.error);
        if (r.ok) save({ birthDate: r.value });
      } else if (field === 'height') {
        const r = parseHeight(profile.units, drafts);
        fail(field, r.ok ? undefined : r.error);
        if (r.ok) save({ heightCm: r.value });
      } else {
        const r = parseBodyWeight(profile.units, drafts.goalWeight);
        fail(field, r.ok ? undefined : r.error);
        if (!r.ok) return;
        // Goals below a healthy weight (BMI 18.5) aren't planned for.
        const min =
          profile.heightCm === undefined ? undefined : minimumGoalWeightKg(profile.heightCm);
        if (min !== undefined && r.value < min) {
          fail(
            field,
            `The lowest goal weight for your height is ${formatWeight(min, profile.units)} (a BMI of 18.5).`,
          );
          return;
        }
        const patch: Partial<Profile> = { goalWeightKg: r.value };
        // A pace that no longer fits the new goal falls back to maintain.
        if (
          currentKg !== undefined &&
          profile.weeklyGoalKg !== undefined &&
          !weeklyGoalOptions(currentKg, r.value).includes(profile.weeklyGoalKg)
        ) {
          patch.weeklyGoalKg = 0;
        }
        save(patch);
      }
    },
    setSex: (sex: NonNullable<Profile['sex']>) => {
      save({ sex });
    },
    setActivity: (activity: NonNullable<Profile['activity']>) => {
      save({ activity });
    },
    setWeeklyGoal: (weeklyGoalKg: WeeklyGoal) => {
      save({ weeklyGoalKg });
    },
  };
}
