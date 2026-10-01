import { useState } from 'react';
import type { ProfileRepository, WeightRepository } from '@/data';
import {
  ageOn,
  cmToFeetInches,
  kgToLb,
  parseAge,
  parseBodyWeight,
  parseHeight,
  type LocalDate,
  type Profile,
  type Sex,
} from '@/domain';
import { HeightField } from '@/features/profile';
import { NumberField, SegmentedControl } from '@/ui';
import { OnboardingStep, type StepPosition } from '../components/OnboardingStep';

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const;

type Field = 'sex' | 'age' | 'height' | 'weight';
const oneDecimal = (n: number) => String(Math.round(n * 10) / 10);

function draftsFrom(p: Profile, currentKg: number | undefined, today: LocalDate) {
  const ftIn = p.heightCm === undefined ? undefined : cmToFeetInches(p.heightCm);
  return {
    age: p.birthDate ? String(ageOn(p.birthDate, today)) : '',
    cm: p.heightCm === undefined ? '' : oneDecimal(p.heightCm),
    ft: ftIn ? String(ftIn.feet) : '',
    in: ftIn ? String(ftIn.inches) : '',
    weight:
      currentKg === undefined
        ? ''
        : oneDecimal(p.units === 'metric' ? currentKg : kgToLb(currentKg)),
  };
}

interface AboutYouStepProps extends StepPosition {
  profile: Profile;
  currentKg: number | undefined;
  today: LocalDate;
  repos: { profile: Pick<ProfileRepository, 'update'>; weights: Pick<WeightRepository, 'set'> };
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

/** Sex, age, height and current weight: what the calorie formula needs about you. */
export function AboutYouStep({ profile, currentKg, today, repos, ...nav }: AboutYouStepProps) {
  const [sex, setSex] = useState<Sex | undefined>(profile.sex);
  const [drafts, setDrafts] = useState(() => draftsFrom(profile, currentKg, today));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const edit = (field: keyof typeof drafts, value: string) => {
    setDrafts((d) => ({ ...d, [field]: value }));
    const key: Field = field === 'cm' || field === 'ft' || field === 'in' ? 'height' : field;
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const next = async () => {
    const birth = parseAge(drafts.age, today, profile.birthDate);
    const height = parseHeight(profile.units, drafts);
    const weight = parseBodyWeight(profile.units, drafts.weight);
    const found: Partial<Record<Field, string>> = {
      sex: sex ? undefined : 'Choose the one the formula should use.',
      age: birth.ok ? undefined : birth.error,
      height: height.ok ? undefined : height.error,
      weight: weight.ok ? undefined : weight.error,
    };
    setErrors(found);
    if (!sex || !birth.ok || !height.ok || !weight.ok) return;
    await repos.profile.update({ sex, birthDate: birth.value, heightCm: height.value });
    await repos.weights.set(today, weight.value);
    nav.onNext();
  };

  return (
    <OnboardingStep
      {...nav}
      title="About you"
      intro="Used only to estimate your needs. You can change these anytime in Profile."
      nextLabel="Next"
      onNext={() => {
        void next();
      }}
    >
      <SegmentedControl
        label="Sex (for the calorie formula)"
        options={SEX_OPTIONS}
        value={sex}
        error={errors.sex}
        onChange={(v) => {
          setSex(v);
          setErrors((e) => ({ ...e, sex: undefined }));
        }}
      />
      <NumberField
        label="Age"
        unit="years"
        inputMode="numeric"
        value={drafts.age}
        error={errors.age}
        onChange={(v) => {
          edit('age', v);
        }}
      />
      <HeightField units={profile.units} drafts={drafts} error={errors.height} onEdit={edit} />
      <NumberField
        label="Current weight"
        unit={profile.units === 'metric' ? 'kg' : 'lb'}
        hint="This becomes your first weigh-in."
        value={drafts.weight}
        error={errors.weight}
        onChange={(v) => {
          edit('weight', v);
        }}
      />
    </OnboardingStep>
  );
}
