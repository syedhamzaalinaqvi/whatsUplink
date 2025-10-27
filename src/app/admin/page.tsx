
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { getPaginatedGroups, getModerationSettings } from './actions';
import { notFound } from 'next/navigation';

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

    return (
      <AdminDashboard
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
