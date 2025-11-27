
'use client';

import { useState } from 'react';
import type { Category, Country, GroupLink, ModerationSettings, LayoutSettings, Report } from '@/lib/data';
import { AdminLogin } from '@/components/admin/admin-login';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

type AdminPageClientProps = {
  initialGroups: GroupLink[];
  allGroupsForStats: GroupLink[];
  initialTotalPages: number;
  initialTotalGroups: number;
  initialModerationSettings: ModerationSettings;
  initialCategories: Category[];
  initialCountries: Country[];
  initialLayoutSettings: LayoutSettings;
  initialReports: Report[];
};

export function AdminPageClient({
  initialGroups,
  allGroupsForStats,
  initialTotalPages,
  initialTotalGroups,
  initialModerationSettings,
  initialCategories,
  initialCountries,
  initialLayoutSettings,
  initialReports,
}: AdminPageClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminDashboard
      initialGroups={initialGroups}
      allGroupsForStats={allGroupsForStats}
      initialTotalPages={initialTotalPages}
      initialTotalGroups={initialTotalGroups}
      initialModerationSettings={initialModerationSettings}
      initialCategories={initialCategories}
      initialCountries={initialCountries}
      initialLayoutSettings={initialLayoutSettings}
      initialReports={initialReports}
    />
  );
}

    