'use client';

import { DashboardProvider } from '@/components/contexts/dashboardContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
