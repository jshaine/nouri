import { useId, type ReactNode } from 'react';
import { Button } from '@/ui';
import styles from './Onboarding.module.css';

export interface OnboardingStepProps {
  step: number;
  total: number;
  title: string;
  intro?: string;
  children?: ReactNode;
  nextLabel: string;
  onNext: () => void;
  onBack?: (() => void) | undefined;
  /** "Skip, I'll set goals myself" — on every step but the last. */
  onSkip?: (() => void) | undefined;
}

/** One screen of first-launch setup. */
export function OnboardingStep({
  step,
  total,
  title,
  intro,
  children,
  nextLabel,
  onNext,
  onBack,
  onSkip,
}: OnboardingStepProps) {
  const titleId = useId();
  return (
    <section className={styles.step} aria-labelledby={titleId}>
      <p className={styles.progress}>
        Step {step} of {total}
      </p>
      <h1 id={titleId} className={styles.title}>
        {title}
      </h1>
      {intro && <p className={styles.intro}>{intro}</p>}
      <div className={styles.body}>{children}</div>
      <div className={styles.actions}>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button variant="primary" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
      {onSkip && (
        <Button variant="ghost" block onClick={onSkip}>
          Skip, I’ll set goals myself
        </Button>
      )}
    </section>
  );
}
