import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { adminDb } from '@/lib/firebase-admin';

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const group = await getGroupById(adminDb, params.id);
  
  if (!group) {
    notFound();
  }

  const relatedGroups = await getRelatedGroups(adminDb, group);

  return <GroupDetailView group={group} relatedGroups={relatedGroups} />;
}

    