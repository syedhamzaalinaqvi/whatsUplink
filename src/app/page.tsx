
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from '@/lib/admin-settings';
import { getCategories, getCountries, seedInitialData, getPaginatedGroups } from '@/app/admin/actions';

export default async function Home() {
  // Fetch the global settings on the server.
  const settings = await getModerationSettings();

  // Seed initial data if necessary, then fetch the first page of groups
  // and the filter options. This initial fetch provides faster first-load.
  await seedInitialData();

  const [initialData, categories, countries] = await Promise.all([
      getPaginatedGroups(settings.groupsPerPage, 'first', undefined),
      getCategories(),
      getCountries()
  ]);

  // Pass the server-fetched data to the client component.
  // The client component will then take over with real-time updates.
  return (
    <HomePage 
      initialSettings={settings}
      initialGroups={initialData.groups}
      initialCategories={categories}
      initialCountries={countries}
    />
  );
}
