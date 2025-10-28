
'use client';

import { useState } from 'react';
import type { GroupLink, ModerationSettings } from '@/lib/data';
import { AdminLogin } from '@/components/admin/admin-login';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

type AdminPageClientProps = {
  initialGroups: GroupLink[];
  initialHasNextPage: boolean;
  initialHasPrevPage: boolean;
  initialModerationSettings: ModerationSettings;
};

export function AdminPageClient({
  initialGroups,
  initialHasNextPage,
  initialHasPrevPage,
  initialModerationSettings,
}: AdminPageClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminDashboard
      initialGroups={initialGroups}
      initialHasNextPage={initialHasNextPage}
      initialHasPrevPage={initialHasPrevPage}
      initialModerationSettings={initialModerationSettings}
    />
  );
}
