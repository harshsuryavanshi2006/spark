import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '@/integrations/firebase/client';
import { isBootstrappedAdminEmail } from '@/lib/events-data';

export type AccountUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  firebaseUser: User;
};

function toAccountUser(user: User | null): AccountUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    firebaseUser: user,
  };
}

const AccountContext = createContext<AccountUser | null>(null);
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  // Always start as null so initial client hydration matches SSR HTML before Firebase Auth syncs.
  const [user, setUser] = useState<AccountUser | null>(null);
  const router = useRouter();
  const client = useQueryClient();

  useEffect(() => {
    let initialized = false;
    let previousUid: string | null = auth.currentUser?.uid ?? null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const nextUid = firebaseUser?.uid ?? null;
      setUser(toAccountUser(firebaseUser));

      if (firebaseUser?.emailVerified && isBootstrappedAdminEmail(firebaseUser.email)) {
        void client.invalidateQueries({ queryKey: ['events'] });
      }

      if (!initialized) {
        initialized = true;
        previousUid = nextUid;
        return;
      }

      if (nextUid === previousUid) return;
      previousUid = nextUid;

      if (!nextUid) {
        client.clear();
      }
      queueMicrotask(() => {
        void router.invalidate();
        if (nextUid) {
          void client.invalidateQueries();
        }
      });
    });

    return () => unsubscribe();
  }, [router, client]);

  return <AccountContext.Provider value={user}>{children}</AccountContext.Provider>;
}
