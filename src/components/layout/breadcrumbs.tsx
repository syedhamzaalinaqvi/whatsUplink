
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-card/50 border-b">
        <div className="container py-3">
            <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {items.map((item, index) => (
                    <Fragment key={index}>
                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                    <li>
                        {item.href ? (
                        <Link href={item.href} className="hover:text-primary transition-colors">
                            {item.label}
                        </Link>
                        ) : (
                        <span className="font-semibold text-foreground">{item.label}</span>
                        )}
                    </li>
                    </Fragment>
                ))}
                </ol>
            </nav>
        </div>
    </div>
  );
}
