'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/context/AuthContext';
import { ScheduleProvider } from '@/context/ScheduleContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ScheduleProvider>{children}</ScheduleProvider>
    </AuthProvider>
  );
}
