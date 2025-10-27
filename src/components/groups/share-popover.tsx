'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// A simple SVG icon component for social media icons
const SocialIcon = ({ name, path }: { name: string, path: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <title>{name}</title>
        <path d={path} />
    </svg>
);

const socialIcons = {
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    twitter: 'M22 4s-.7 2.1-2 3.4c1.6 1.4 3.3 4.4 3.3 4.4s-1.4 1-3.3 1.1c-.2 2.3-1.2 4.6-3.8 6.1-2.9 1.7-6.5 2.2-9.6 1.2-3.1-1-5.2-3.9-5.6-7.1.3 0 .6.1.9.1.9 0 1.8-.2 2.7-.5-1.1-.2-2.1-1.1-2.5-2.2-.3-1.1-.1-2.3.6-3.3.4.5.8.9 1.3 1.3 1.8 1.5 4.1 2.3 6.5 2.6-.5-2.2.4-4.5 2.2-5.7 1.8-1.2 4.1-1.1 5.8.1z',
    whatsapp: 'M21.3 3.6A11.9 11.9 0 0 0 12 0 12 12 0 0 0 2.2 18.1L.1 24l6-2.1c2.4 1.4 5.2 2.2 8 2.1a12 12 0 0 0 11.8-12.3c-.1-2.7-1.2-5.3-3.6-7.2zm-9.3 18.5a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1.2L3.4 18c-.2-.3-.4-.7-.5-1a9.9 9.9 0 0 1 7-11.8c2.4-1.2 5.2-1.3 7.7-.3a10 10 0 0 1 6.5 13.9 10 10 0 0 1-14 3.2zM17.4 14c-.2-.1-1.3-.7-1.5-.7s-.4-.1-.6.1-.6.7-.7.9-.3.2-.5 0c-.2-.1-1-.4-1.8-1.1-.7-.6-1.1-1.4-1.2-1.6s0-.3.1-.4c.1-.1.2-.3.3-.4.1-.1.2-.2.3-.4.1-.1 0-.3-.1-.4-.1-.1-1.5-3.5-2-4.8s-1-.9-.9-1.3c0-.3.2-.5.4-.5h.6c.2 0 .5.1.8.3.3.2 1 2.4 1.1 2.6s.2.3.3.5c.1.2.1.4 0 .6-.1.2-.2.3-.4.5s-.3.4-.4.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.4s1.6 1.2 1.8 1.3c.2.1.3.1.4 0 .1-.2.6-2 .7-2.2.1-.2.3-.2.5-.1.2 0 1.3.6 1.5.7.2.1.4.2.4.3.1.3 0 .7-.1.8s-1.5 1.7-1.8 2c-.3.2-.5.3-.7.3h-.2z',
    telegram: 'M15 12l-4-2 6-8-14 8 4 2 2 6 3-4',
    linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM6 9H2V21h4zM4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    email: 'M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z',
};

type SharePopoverProps = {
  title: string;
  url: string;
  children: React.ReactNode;
};

export function SharePopover({ title, url, children }: SharePopoverProps) {
  const { toast } = useToast();
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // Make sure window is defined (runs on client)
    if (typeof window !== 'undefined') {
      setFullUrl(new URL(url, window.location.origin).href);
    }
  }, [url]);


  const socialShares = [
    { name: 'Facebook', icon: socialIcons.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`},
    { name: 'Twitter', icon: socialIcons.twitter, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`},
    { name: 'WhatsApp', icon: socialIcons.whatsapp, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + fullUrl)}`},
    { name: 'Telegram', icon: socialIcons.telegram, href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}` },
    { name: 'LinkedIn', icon: socialIcons.linkedin, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}` },
    { name: 'Email', icon: socialIcons.email, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check out this link: ' + fullUrl)}` },
  ];

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: 'Link Copied!',
        description: 'Group link copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  if(!fullUrl) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-4">
            <h4 className="font-medium text-center text-sm mb-4">Share on</h4>
            <div className="grid grid-cols-3 gap-4">
                {socialShares.map(social => (
                    <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10">
                            <SocialIcon name={social.name} path={social.icon} />
                        </div>
                        <span className="text-xs">{social.name}</span>
                    </a>
                ))}
            </div>
        </div>
        <div className="p-2 bg-muted/50">
            <div className="flex items-center space-x-2">
                <Input
                    value={fullUrl}
                    readOnly
                    className="h-8 text-xs bg-background"
                />
                <Button type="button" size="sm" className="px-3 h-8" onClick={handleCopy}>
                    <span className="sr-only">Copy</span>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
