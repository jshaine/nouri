import { ChartColumn, ClipboardList, Settings, UserRound } from 'lucide-react';
import type { RouteObject } from 'react-router';
import type { Repositories } from '@/data';
import { TodayContainer } from '@/features/today';
import { AppLayout } from './layout/AppLayout';
import { Placeholder } from './screens/Placeholder';

/** Route table. Screens receive the repositories they need as props. */
export function appRoutes(repos: Repositories): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <TodayContainer repos={repos} /> },
        {
          path: 'history',
          element: (
            <Placeholder title="History" icon={ChartColumn}>
              Your week at a glance, with daily calories against your goal.
            </Placeholder>
          ),
        },
        {
          path: 'profile',
          element: (
            <Placeholder title="Profile" icon={UserRound}>
              Your profile, goal calculator and weight log.
            </Placeholder>
          ),
        },
        {
          path: 'settings',
          element: (
            <Placeholder title="Settings" icon={Settings}>
              Goals, theme, units and backups.
            </Placeholder>
          ),
        },
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
