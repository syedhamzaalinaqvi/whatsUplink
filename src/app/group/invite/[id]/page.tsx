import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const group = await getGroupById(params.id);
  
  if (!group) {
    notFound();
  }

  const relatedGroups = await getRelatedGroups(group);

  return <GroupDetailView group={group} relatedGroups={relatedGroups} />;
}
