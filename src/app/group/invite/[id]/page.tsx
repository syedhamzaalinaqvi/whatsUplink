
import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { initializeFirebase } from '@/firebase';

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const { firestore } = initializeFirebase();
  const group = await getGroupById(firestore, params.id);
  
  if (!group) {
    notFound();
  }

  const relatedGroups = await getRelatedGroups(firestore, group);

  return <GroupDetailView group={group} relatedGroups={relatedGroups} />;
}
