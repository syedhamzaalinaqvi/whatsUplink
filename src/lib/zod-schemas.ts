import { z } from 'zod';

export const submitGroupSchema = z.object({
  link: z.string().url('Please enter a valid WhatsApp group link.').refine(
    (link) => link.startsWith('https://chat.whatsapp.com/'),
    { message: 'Link must be a valid WhatsApp group invite link.' }
  ),
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  country: z.string().min(1, 'Please select a country.'),
  type: z.enum(['group', 'channel'], { required_error: 'Please select a type.' }),
  tags: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL.').optional(),
  imageHint: z.string().optional(),
});
