import type { GroupLink } from '@/lib/data';

export type FormState = {
  message: string;
  group?: GroupLink;
  errors?: {
    link?: string[];
    title?: string[];
    description?: string[];
    category?: string[];
    country?: string[];
    type?: string[];
    tags?: string[];
    imageUrl?: string[];
    _form?: string[];
  };
};
