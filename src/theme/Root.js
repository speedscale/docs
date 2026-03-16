import React from 'react';
import Head from '@docusaurus/Head';

// Canonical URLs are handled natively by Docusaurus (respects trailingSlash
// and the site url in docusaurus.config.js).  Do NOT add a duplicate
// <link rel="canonical"> here — it causes React hydration mismatch (#418).

// Site-wide Organization schema (singleton, same on every page)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Speedscale',
  url: 'https://speedscale.com',
  logo: 'https://docs.speedscale.com/img/speedscale.svg',
  sameAs: [
    'https://twitter.com/speedscaleai',
    'https://www.linkedin.com/company/speedscale/',
    'https://github.com/speedscale',
  ],
};

// Site-wide WebSite schema for the docs site
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Speedscale Docs',
  url: 'https://docs.speedscale.com',
  publisher: {
    '@type': 'Organization',
    name: 'Speedscale',
    url: 'https://speedscale.com',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://docs.speedscale.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function Root({ children }) {
  return (
    <>
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webSiteSchema)}
        </script>
      </Head>
      {children}
    </>
  );
}
