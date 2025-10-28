
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from './admin/actions';

export default async function Home() {
  // Fetch the global settings on the server.
  const settings = await getModerationSettings();

  // Pass the global settings to the client component.
  return <HomePage initialSettings={settings} />;
}
