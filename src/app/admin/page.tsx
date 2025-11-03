
import { getPaginatedGroups, getCategories, getCountries, seedInitialData, getLayoutSettings, getReports } from './actions';
import { getModerationSettings } from '@/lib/admin-settings';
import { notFound } from 'next/navigation';
import { AdminPageClient } from './admin-page-client';

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: {
    rows?: string;
    page?: 'next' | 'prev' | 'first';
    cursor?: string;
  };
}) {

  const rowsPerPage = searchParams?.rows ? parseInt(searchParams.rows, 10) : 50;
  const pageDirection = searchParams?.page || 'first';
  const cursor = searchParams?.cursor;

  try {
    // Seed data if necessary, then fetch everything
    await seedInitialData();
    
    const [initialData, moderationSettings, categories, countries, layoutSettings, reports] = await Promise.all([
      getPaginatedGroups(rowsPerPage, pageDirection, cursor),
      getModerationSettings(),
      getCategories(),
      getCountries(),
      getLayoutSettings(),
      getReports(),
    ]);

    return (
      <AdminPageClient
        initialGroups={initialData.groups}
        initialHasNextPage={initialData.hasNextPage}
        initialHasPrevPage={initialData.hasPrevPage}
        initialModerationSettings={moderationSettings}
        initialCategories={categories}
        initialCountries={countries}
        initialLayoutSettings={layoutSettings}
        initialReports={reports}
      />
    );
  } catch (error) {
    console.error('Failed to load admin data:', error);
    return notFound();
  }
}
