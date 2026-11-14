import React from "react";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import SiteSearch from "../components/SiteSearch";

export default function SearchPage() {
  return (
    <Layout
      title="Search"
      description="Search Speedscale documentation, articles, and resources."
    >
      <Head><meta name="robots" content="noindex,follow" /></Head>
      <main className="docs-search-page">
        <h1>Search Speedscale</h1>
        <p>
          Find documentation and practical guides for testing your services.
        </p>
        <SiteSearch />
      </main>
    </Layout>
  );
}
