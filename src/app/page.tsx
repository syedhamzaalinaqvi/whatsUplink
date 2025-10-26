
import { HomePage } from '@/components/groups/home-page';

export default async function Home() {
  // initialGroups will now be fetched on the client side in real-time
  return <HomePage initialGroups={[]} />;
}
