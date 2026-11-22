import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { auth } from '@/integrations/firebase/client';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await auth.authStateReady();
    if (!auth.currentUser) {
      throw redirect({
        to: '/auth',
        search: {
          mode: 'login',
          event: new URLSearchParams(location.searchStr).get('event') ?? '',
          next: location.pathname === '/registration' ? 'registration' : 'profile',
        },
      });
    }
  },
  component: Outlet,
});
