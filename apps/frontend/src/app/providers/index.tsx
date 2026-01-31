'use client';

import { SessionProvider } from 'next-auth/react';
import { ReduxProvider } from './redux-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>{children}</ReduxProvider>
    </SessionProvider>
  );
}
