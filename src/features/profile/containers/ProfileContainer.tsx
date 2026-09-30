import { useId, type ReactNode } from 'react';
import type { ProfileRepository, WeightRepository } from '@/data';
import { latestWeight, toLocalDate } from '@/domain';
import { SegmentedControl, useDocumentTitle, useLive } from '@/ui';
import { ProfileDetailsContainer } from './ProfileDetailsContainer';
import styles from './ProfileContainer.module.css';

const UNIT_OPTIONS = [
  { value: 'metric', label: 'kg, cm' },
  { value: 'imperial', label: 'lb, ft/in' },
] as const;

export interface ProfileContainerProps {
  repos: {
    profile: Pick<ProfileRepository, 'live' | 'update'>;
    weights: Pick<WeightRepository, 'live'>;
  };
  now?: () => Date;
  /** Sections below the details (weight log, suggested goals). */
  children?: ReactNode;
}

export function ProfileContainer({
  repos,
  now = () => new Date(),
  children,
}: ProfileContainerProps) {
  useDocumentTitle('Profile');
  const today = toLocalDate(now());
  const profile = useLive(() => repos.profile.live(), [repos.profile]);
  const weights = useLive(() => repos.weights.live(), [repos.weights]);
  const p = profile.value;
  const detailsId = useId();

  return (
    <div className={styles.screen}>
      <h1 className={styles.heading}>Profile</h1>
      {p && weights.value && (
        <section className={styles.section} aria-labelledby={detailsId}>
          <h2 id={detailsId} className={styles.title}>
            Your details
          </h2>
          <SegmentedControl
            label="Units"
            options={UNIT_OPTIONS}
            value={p.units}
            onChange={(units) => {
              void repos.profile.update({ units });
            }}
          />
          {/* Remount on unit change so typed drafts show in the new units. */}
          <ProfileDetailsContainer
            key={p.units}
            profile={p}
            repo={repos.profile}
            currentKg={latestWeight(weights.value)?.kg}
            today={today}
          />
        </section>
      )}
      {children}
    </div>
  );
}
