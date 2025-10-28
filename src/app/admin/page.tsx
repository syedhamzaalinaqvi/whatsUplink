
import { getPaginatedGroups, getModerationSettings, getCategories, getCountries, seedInitialData } from './actions';
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
    
    const [initialData, moderationSettings, categories, countries] = await Promise.all([
      getPaginatedGroups(rowsPerPage, pageDirection, cursor),
      getModerationSettings(),
      getCategories(),
      getCountries(),
    ]);

    return (
      <AdminPageClient
        initialGroups={initialData.groups}
        initialHasNextPage={initialData.hasNextPage}
        initialHasPrevPage={initialData.hasPrevPage}
        initialModerationSettings={moderationSettings}
        initialCategories={categories}
        initialCountries={countries}
      />
    );
  } catch (error) {
    console.error('Failed to load admin data:', error);
    return notFound();
  }
}
