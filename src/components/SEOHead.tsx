import React, { useEffect } from 'react';
import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  schemaData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = '/LOGO-small.svg',
  ogType = 'website',
  schemaData
}) => {
  const fullTitle = title ? `${title} | Dynamia AI` : 'Dynamia AI - Unified Heterogeneous Computing';
  const fullCanonical = canonical ? `https://dynamia.ai${canonical}` : undefined;
  const fullOgImage = `https://dynamia.ai${ogImage}`;

  useEffect(() => {
    // Update document title for client-side navigation
    if (title) {
      document.title = fullTitle;
    }
  }, [fullTitle, title]);

  return (
    <Head>
      {title && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph tags */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Dynamia AI" />
      {canonical && <meta property="og:url" content={fullCanonical} />}
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* Structured Data */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaData)
          }}
        />
      )}
    </Head>
  );
};

export default SEOHead; 