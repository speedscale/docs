import React, { useEffect } from 'react';
import { useLocation } from '@docusaurus/router';

export default function Root({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Generate canonical URL
    // Strip query parameters and ensure trailing slash for directory format
    let pathname = location.pathname;

    // Add trailing slash for directory format (unless root or file with extension)
    if (pathname !== '/' && !pathname.endsWith('/') && !pathname.match(/\.[a-z]+$/i)) {
      pathname += '/';
    }

    // Create canonical URL using the configured site URL
    const canonicalURL = new URL(pathname, 'https://docs.speedscale.com');
    // Strip query parameters to avoid duplicates
    canonicalURL.search = '';

    // Update or create canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalURL.toString();

    // Cleanup function to remove canonical link when component unmounts
    return () => {
      const link = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.remove();
      }
    };
  }, [location.pathname]);

  return <>{children}</>;
}
