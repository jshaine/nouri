import { ClipboardList } from 'lucide-react';
import type { RouteObject } from 'react-router';
import type { Repositories } from '@/data';
import { HistoryContainer } from '@/features/history';
import { OnboardingContainer } from '@/features/onboarding';
import { ProfileContainer } from '@/features/profile';
import { SettingsContainer } from '@/features/settings';
import { TodayContainer } from '@/features/today';
import { AppLayout } from './layout/AppLayout';
import { OnboardingGate } from './layout/OnboardingGate';
import { Placeholder } from './screens/Placeholder';

/** Route table. Screens receive the repositories they need as props. */
export function appRoutes(repos: Repositories): RouteObject[] {
  return [
    { path: 'welcome', element: <OnboardingContainer repos={repos} /> },
    {
      element: (
        <OnboardingGate settings={repos.settings}>
          <AppLayout />
        </OnboardingGate>
      ),
      children: [
        { index: true, element: <TodayContainer repos={repos} /> },
        { path: 'history', element: <HistoryContainer repos={repos} /> },
        { path: 'profile', element: <ProfileContainer repos={repos} /> },
        { path: 'settings', element: <SettingsContainer repos={repos} /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ];
}

function NotFound() {
  return (
    <Placeholder title="Page not found" icon={ClipboardList}>
      That page doesn’t exist. Use the tabs to get back to your log.
    </Placeholder>
  );
}
