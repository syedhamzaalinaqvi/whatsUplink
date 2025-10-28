
import { getPaginatedGroups, getModerationSettings } from './actions';
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
    const [initialData, moderationSettings] = await Promise.all([
      getPaginatedGroups(rowsPerPage, pageDirection, cursor),
      getModerationSettings(),
    ]);

    // The server component now fetches data and passes it to the client component,
    // which will handle the authentication state.
    return (
      <AdminPageClient
        initialGroups={initialData.groups}
        initialHasNextPage={initialData.hasNextPage}
        initialHasPrevPage={initialData.hasPrevPage}
        initialModerationSettings={moderationSettings}
      />
    );
  } catch (error) {
    console.error('Failed to load admin data:', error);
    // You can return a dedicated error component here
    return notFound();
  }
}
