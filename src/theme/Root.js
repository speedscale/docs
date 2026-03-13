import React from 'react';
import Head from '@docusaurus/Head';
import { useLocation } from '@docusaurus/router';

export default function Root({ children }) {
  const location = useLocation();

  // Generate canonical URL at render time (SSR-compatible, not useEffect)
  let pathname = location.pathname;

  // Add trailing slash for directory format (unless root or file with extension)
  if (pathname !== '/' && !pathname.endsWith('/') && !pathname.match(/\.[a-z]+$/i)) {
    pathname += '/';
  }

  // Create canonical URL using the configured site URL
  const canonicalURL = new URL(pathname, 'https://docs.speedscale.com');
  // Strip query parameters to avoid duplicates
  canonicalURL.search = '';

  return (
    <>
      <Head>
        <link rel="canonical" href={canonicalURL.toString()} />
      </Head>
      {children}
    </>
  );
}
