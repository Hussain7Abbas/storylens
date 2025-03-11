import React from 'react';
import { useRoutes } from '~/hooks/useRoutes';
import { HomePage } from '~/pages/home/home';
import { SettingsPage } from '~/pages/settings';
import { ProfilePage } from '~/pages/profile';

export type Routes = 'home' | 'settings' | 'profile';

export function Router() {
  const { current: currentRoute } = useRoutes();

  switch (currentRoute) {
    case 'home':
      return <HomePage />;
    case 'settings':
      return <SettingsPage />;
    case 'profile':
      return <ProfilePage />;
    default:
      return <HomePage />;
  }
}
