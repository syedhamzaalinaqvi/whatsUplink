import { PlaceHolderImages } from '@/lib/placeholder-images';

export type GroupLink = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imageHint: string;
  category: string;
  country: string;
  tags: string[];
};

const placeholderImageMap = new Map(PlaceHolderImages.map(p => [p.id, p]));

export const sampleGroupLinks: GroupLink[] = [
  {
    id: 'nextjs-devs-1',
    title: 'Next.js Devs',
    description: 'A community for Next.js developers. Share tips, ask questions, and stay up-to-date with the latest features. This is a longer description to demonstrate how the full text will appear on the detail page but will be truncated on the main list view. We welcome developers of all skill levels, from beginners to experts. Join us for weekly discussions, code reviews, and special events with industry leaders. Our goal is to foster a supportive and collaborative environment for everyone passionate about Next.js and the future of web development.',
    link: 'https://chat.whatsapp.com/sample1',
    imageUrl: placeholderImageMap.get('group-1')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-1')?.imageHint || 'technology code',
    category: 'Technology',
    country: 'usa',
    tags: ['nextjs', 'react', 'webdev'],
  },
  {
    id: 'global-gamers-2',
    title: 'Global Gamers Hub',
    description: 'Connect with gamers from around the world. Discuss new releases, find teammates, and share your best clips.',
    link: 'https://chat.whatsapp.com/sample2',
    imageUrl: placeholderImageMap.get('group-2')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-2')?.imageHint || 'gaming controller',
    category: 'Gaming',
    country: 'india',
    tags: ['gaming', 'esports', 'community'],
  },
  {
    id: 'foodies-corner-3',
    title: 'Foodies Corner',
    description: 'Share your culinary creations, discover new recipes, and talk about your favorite restaurants.',
    link: 'https://chat.whatsapp.com/sample3',
    imageUrl: placeholderImageMap.get('group-3')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-3')?.imageHint || 'delicious food',
    category: 'Food',
    country: 'pakistan',
    tags: ['food', 'recipes', 'cooking'],
  },
  {
    id: 'wanderlust-travel-4',
    title: 'Wanderlust Travelers',
    description: 'For those who love to travel. Share your travel stories, get advice, and plan your next adventure.',
    link: 'https://chat.whatsapp.com/sample4',
    imageUrl: placeholderImageMap.get('group-4')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-4')?.imageHint || 'mountain landscape',
    category: 'Travel',
    country: 'usa',
    tags: ['travel', 'adventure', 'explore'],
  },
  {
    id: 'book-nook-5',
    title: 'The Book Nook',
    description: 'A cozy corner for book lovers. Monthly reads, author discussions, and genre explorations.',
    link: 'https://chat.whatsapp.com/sample5',
    imageUrl: placeholderImageMap.get('group-5')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-5')?.imageHint || 'books library',
    category: 'Hobbies',
    country: 'india',
    tags: ['books', 'reading', 'book club'],
  },
  {
    id: 'fit-fam-6',
    title: 'Fit Fam',
    description: 'Your daily dose of motivation. Share workout routines, healthy recipes, and track your fitness journey together.',
    link: 'https://chat.whatsapp.com/sample6',
    imageUrl: placeholderImageMap.get('group-6')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-6')?.imageHint || 'gym workout',
    category: 'Health & Fitness',
    country: 'pakistan',
    tags: ['fitness', 'health', 'workout'],
  },
  {
    id: 'tech-innovators-7',
    title: 'Tech Innovators',
    description: 'A group for discussing the latest trends in technology, from AI to blockchain and beyond.',
    link: 'https://chat.whatsapp.com/sample7',
    imageUrl: 'https://picsum.photos/seed/tech/512/512',
    imageHint: 'futuristic technology',
    category: 'Technology',
    country: 'india',
    tags: ['technology', 'AI', 'innovation'],
  }
];

export function getGroupById(id: string | undefined) {
    if (!id) return undefined;
    return sampleGroupLinks.find(group => group.id === id);
}

export function getRelatedGroups(currentGroup: GroupLink | undefined) {
    if (!currentGroup) return [];
    return sampleGroupLinks.filter(
        group => group.id !== currentGroup.id && group.category === currentGroup.category
    ).slice(0, 4); // Get up to 4 related groups
}
