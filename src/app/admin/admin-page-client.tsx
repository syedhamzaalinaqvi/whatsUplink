
'use client';

import { useState } from 'react';
import type { Category, Country, GroupLink, ModerationSettings, LayoutSettings } from '@/lib/data';
import { AdminLogin } from '@/components/admin/admin-login';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

type AdminPageClientProps = {
  initialGroups: GroupLink[];
  initialHasNextPage: boolean;
  initialHasPrevPage: boolean;
  initialModerationSettings: ModerationSettings;
  initialCategories: Category[];
  initialCountries: Country[];
  initialLayoutSettings: LayoutSettings;
};

export function AdminPageClient({
  initialGroups,
  initialHasNextPage,
  initialHasPrevPage,
  initialModerationSettings,
  initialCategories,
  initialCountries,
  initialLayoutSettings,
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
      initialCategories={initialCategories}
      initialCountries={initialCountries}
      initialLayoutSettings={initialLayoutSettings}
    />
  );
}
