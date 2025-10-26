import { PlaceHolderImages } from '@/lib/placeholder-images';

export type GroupLink = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imageHint: string;
  category: string;
};

const placeholderImageMap = new Map(PlaceHolderImages.map(p => [p.id, p]));

export const sampleGroupLinks: GroupLink[] = [
  {
    id: '1',
    title: 'Next.js Devs',
    description: 'A community for Next.js developers. Share tips, ask questions, and stay up-to-date with the latest features.',
    link: 'https://chat.whatsapp.com/sample1',
    imageUrl: placeholderImageMap.get('group-1')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-1')?.imageHint || 'technology code',
    category: 'Technology',
  },
  {
    id: '2',
    title: 'Global Gamers Hub',
    description: 'Connect with gamers from around the world. Discuss new releases, find teammates, and share your best clips.',
    link: 'https://chat.whatsapp.com/sample2',
    imageUrl: placeholderImageMap.get('group-2')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-2')?.imageHint || 'gaming controller',
    category: 'Gaming',
  },
  {
    id: '3',
    title: 'Foodies Corner',
    description: 'Share your culinary creations, discover new recipes, and talk about your favorite restaurants.',
    link: 'https://chat.whatsapp.com/sample3',
    imageUrl: placeholderImageMap.get('group-3')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-3')?.imageHint || 'delicious food',
    category: 'Food',
  },
  {
    id: '4',
    title: 'Wanderlust Travelers',
    description: 'For those who love to travel. Share your travel stories, get advice, and plan your next adventure.',
    link: 'https://chat.whatsapp.com/sample4',
    imageUrl: placeholderImageMap.get('group-4')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-4')?.imageHint || 'mountain landscape',
    category: 'Travel',
  },
  {
    id: '5',
    title: 'The Book Nook',
    description: 'A cozy corner for book lovers. Monthly reads, author discussions, and genre explorations.',
    link: 'https://chat.whatsapp.com/sample5',
    imageUrl: placeholderImageMap.get('group-5')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-5')?.imageHint || 'books library',
    category: 'Hobbies',
  },
  {
    id: '6',
    title: 'Fit Fam',
    description: 'Your daily dose of motivation. Share workout routines, healthy recipes, and track your fitness journey together.',
    link: 'https://chat.whatsapp.com/sample6',
    imageUrl: placeholderImageMap.get('group-6')?.imageUrl || '',
    imageHint: placeholderImageMap.get('group-6')?.imageHint || 'gym workout',
    category: 'Health & Fitness',
  },
];
