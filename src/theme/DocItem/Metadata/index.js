import React from 'react';
import { PageMetadata } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Head from '@docusaurus/Head';

/**
 * Determines the proficiency level based on the doc's URL path.
 * - Getting Started / Tutorial / Quick Start → Beginner
 * - Guides → Intermediate
 * - Reference / Concepts / Security → Expert
 */
function getProficiencyLevel(permalink) {
  if (!permalink) return 'Beginner';
  const path = permalink.toLowerCase();
  if (
    path.includes('/getting-started/') ||
    path.includes('/tutorial') ||
    path.includes('/quick-start')
  ) {
    return 'Beginner';
  }
  if (path.includes('/guides/') || path.includes('/proxymock/guides/')) {
    return 'Intermediate';
  }
  return 'Expert';
}

/**
 * Maps doc section to a descriptive articleSection value.
 */
function getArticleSection(permalink) {
  if (!permalink) return 'Documentation';
  const path = permalink.toLowerCase();
  if (path.includes('/getting-started/')) return 'Getting Started';
  if (path.includes('/concepts/')) return 'Concepts';
  if (path.includes('/guides/')) return 'Guides';
  if (path.includes('/reference/')) return 'Reference';
  if (path.includes('/security/')) return 'Security';
  if (path.includes('/proxymock/')) return 'ProxyMock';
  if (path.includes('/qabot/')) return 'QABot';
  return 'Documentation';
}

export default function DocItemMetadata() {
  const { metadata, frontMatter, assets } = useDoc();

  // Build TechArticle structured data from doc metadata
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metadata.title,
    description: metadata.description || '',
    url: `https://docs.speedscale.com${metadata.permalink}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://docs.speedscale.com${metadata.permalink}`,
    },
    author: {
      '@type': 'Organization',
      name: 'Speedscale',
      url: 'https://speedscale.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Speedscale',
      url: 'https://speedscale.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://docs.speedscale.com/img/speedscale.svg',
      },
    },
    proficiencyLevel: getProficiencyLevel(metadata.permalink),
    articleSection: getArticleSection(metadata.permalink),
    inLanguage: 'en-US',
  };

  // Add dateModified if available from git history
  if (metadata.lastUpdatedAt) {
    structuredData.dateModified = new Date(
      metadata.lastUpdatedAt * 1000
    ).toISOString();
  }

  // Add image if specified in frontmatter
  if (assets.image || frontMatter.image) {
    structuredData.image = assets.image || frontMatter.image;
  }

  return (
    <>
      <PageMetadata
        title={metadata.title}
        description={metadata.description}
        keywords={frontMatter.keywords}
        image={assets.image ?? frontMatter.image}
      />
      <Head>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Head>
    </>
  );
}
