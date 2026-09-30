import {
  DEFAULT_PROFILE,
  isLocalDate,
  isWeeklyGoal,
  ACTIVITY_LEVELS,
  type Profile,
} from '@/domain';
import type { RepoContext } from '../context';
import { live, type Live } from '../live';
import type { ProfileRow } from '../rows';

export interface ProfileRepository {
  live(): Live<Profile>;
  get(): Promise<Profile>;
  update(patch: Partial<Profile>): Promise<void>;
}

const ACTIVITY_IDS: readonly string[] = ACTIVITY_LEVELS.map((a) => a.id);
const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** Rows may come from older versions or imports: keep only valid values. */
export function rowToProfile(row: ProfileRow | undefined): Profile {
  if (!row) return { ...DEFAULT_PROFILE };
  const p: Profile = {
    units: row.units === 'imperial' ? 'imperial' : 'metric',
    // Rows can come from imports, so check the actual value, not the type.
    exerciseCaloriesEnabled: (row.exerciseCaloriesEnabled as unknown) === true,
  };
  if (row.sex === 'male' || row.sex === 'female') p.sex = row.sex;
  if (isLocalDate(row.birthDate)) p.birthDate = row.birthDate;
  if (positive(row.heightCm)) p.heightCm = row.heightCm;
  if (positive(row.goalWeightKg)) p.goalWeightKg = row.goalWeightKg;
  if (row.activityLevel && ACTIVITY_IDS.includes(row.activityLevel)) p.activity = row.activityLevel;
  if (isWeeklyGoal(row.weeklyGoalKg)) p.weeklyGoalKg = row.weeklyGoalKg;
  return p;
}

function profileToRow(p: Profile): ProfileRow {
  const row: ProfileRow = {
    id: 'me',
    units: p.units,
    exerciseCaloriesEnabled: p.exerciseCaloriesEnabled,
  };
  if (p.sex) row.sex = p.sex;
  if (p.birthDate) row.birthDate = p.birthDate;
  if (p.heightCm !== undefined) row.heightCm = p.heightCm;
  if (p.goalWeightKg !== undefined) row.goalWeightKg = p.goalWeightKg;
  if (p.activity) row.activityLevel = p.activity;
  if (p.weeklyGoalKg !== undefined) row.weeklyGoalKg = p.weeklyGoalKg;
  return row;
}

export function profileRepository({ db }: RepoContext): ProfileRepository {
  const get = async () => rowToProfile(await db.profile.get('me'));
  return {
    live: () => live(get),
    get,
    async update(patch) {
      await db.transaction('rw', db.profile, async () => {
        await db.profile.put(profileToRow({ ...(await get()), ...patch }));
      });
    },
  };
}
