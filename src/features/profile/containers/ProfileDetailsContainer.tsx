import type { ProfileRepository } from '@/data';
import type { LocalDate, Profile } from '@/domain';
import { ProfileDetailsForm } from '../components/ProfileDetailsForm';
import { useProfileForm } from '../hooks/useProfileForm';

interface ProfileDetailsContainerProps {
  profile: Profile;
  repo: Pick<ProfileRepository, 'update'>;
  currentKg: number | undefined;
  today: LocalDate;
}

export function ProfileDetailsContainer({
  profile,
  repo,
  currentKg,
  today,
}: ProfileDetailsContainerProps) {
  const form = useProfileForm(profile, repo, currentKg, today);
  return (
    <ProfileDetailsForm
      profile={profile}
      drafts={form.drafts}
      errors={form.errors}
      paces={form.paces}
      today={today}
      hasWeight={currentKg !== undefined}
      onEdit={form.edit}
      onCommit={(field) => {
        form.commit(field);
      }}
      onSex={form.setSex}
      onActivity={form.setActivity}
      onWeeklyGoal={form.setWeeklyGoal}
    />
  );
}
