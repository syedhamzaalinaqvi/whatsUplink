
import { z } from 'zod';

export const submitGroupSchema = z.object({
  link: z.string().url({ message: 'Please enter a valid URL.' }),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  country: z.string().min(1, 'Please select a country'),
  type: z.enum(['group', 'channel'], { required_error: 'Please select a type' }),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional()
}).refine(data => {
    if (data.type === 'group') {
        return data.link.startsWith('https://chat.whatsapp.com/');
    }
    if (data.type === 'channel') {
        return data.link.includes('whatsapp.com/channel'); 
    }
    return false;
}, {
    message: "Please enter a valid WhatsApp Group or Channel link.",
    path: ['link'],
});
