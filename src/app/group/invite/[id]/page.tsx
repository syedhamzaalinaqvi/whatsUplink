import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const group = getGroupById(params.id);
  const relatedGroups = getRelatedGroups(group);

  if (!group) {
    notFound();
  }

  return <GroupDetailView group={group} relatedGroups={relatedGroups} />;
}
