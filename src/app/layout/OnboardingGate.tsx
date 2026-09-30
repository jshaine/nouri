import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import type { SettingsRepository } from '@/data';
import { useLive } from '@/ui';

interface OnboardingGateProps {
  settings: Pick<SettingsRepository, 'live'>;
  children: ReactNode;
}

/** Sends first-time users to /welcome until setup is finished or skipped. */
export function OnboardingGate({ settings, children }: OnboardingGateProps) {
  const s = useLive(() => settings.live(), [settings]);
  if (!s.value) return null;
  if (!s.value.onboardingDone) return <Navigate to="/welcome" replace />;
  return children;
}
