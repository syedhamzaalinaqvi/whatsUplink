
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from './admin/actions';

export default async function Home() {
  // Fetch the global setting on the server.
  const settings = await getModerationSettings();

  // Pass the global `showClicks` setting to the client component.
  return <HomePage initialShowClicks={settings.showClicks} />;
}
