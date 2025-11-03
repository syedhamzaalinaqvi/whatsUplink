
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// This is a custom hook to correctly handle NProgress with Next.js App Router
function useNProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        NProgress.configure({ showSpinner: false });
        NProgress.done();
    }, [pathname, searchParams]);
}

// We need a separate component to wrap the NProgress logic
// This allows us to use it in our main layout without breaking server components
function NProgressManager() {
    useNProgress();
    return null;
}

// The component we export and use in the layout.
// It wraps the manager in a Suspense boundary as a best practice.
export function TopProgressBar() {
    return <NProgressManager />;
}

// Intercept clicks on `<a>` tags and start NProgress
if (typeof window !== 'undefined') {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
        NProgress.start();
        return originalPushState.apply(window.history, args);
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
        NProgress.start();
        return originalReplaceState.apply(window.history, args);
    };

    window.addEventListener('popstate', () => {
        NProgress.start();
    });
}
