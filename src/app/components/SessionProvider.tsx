'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

function SentryUserContext() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user) {
      Sentry.setUser({ id: session.user.id, email: session.user.email ?? undefined });
    } else {
      Sentry.setUser(null);
    }
  }, [session]);
  return null;
}

export default function AppSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserContext />
      {children}
    </SessionProvider>
  );
}
