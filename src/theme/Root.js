import React from 'react';

// Root theme wrapper.
// Canonical URLs are handled natively by Docusaurus (respects trailingSlash
// and the site url in docusaurus.config.js).  A previous version of this file
// injected a duplicate <link rel="canonical"> via <Head>, which caused a React
// hydration mismatch (error #418) and broke client-side features like search.
export default function Root({ children }) {
  return <>{children}</>;
}
