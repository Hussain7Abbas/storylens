import { useRoutes } from '@/hooks/useRoutes';
import { HomePage } from '@/pages/home/home';
import { SettingsPage } from '@/pages/settings/settings';

export function Router() {
  const { current: currentRoute } = useRoutes();

  switch (currentRoute) {
    case 'home':
      return <HomePage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}
