
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // We use the pathname and searchParams to trigger the progress bar
    // on any route changes.
    handleStop(); // Stop progress on initial load or change
    
    return () => {
      handleStop(); // Clean up on component unmount
    };
  }, [pathname, searchParams]);

  // The component doesn't render anything itself, it just manages NProgress.
  return null;
}
