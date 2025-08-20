import React from 'react';

interface StructuredDataProps {
  data: object;
}

const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  );
};

// Predefined structured data templates
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Dynamia AI",
  "url": "https://dynamia.ai",
  "logo": "https://dynamia.ai/LOGO-small.svg",
  "description": "Enterprise-grade heterogeneous computing platform for AI, HPC, and Edge workloads",
  "foundingDate": "2023",
  "industry": "Software Technology",
  "numberOfEmployees": "10-50",
  "sameAs": [
    "https://github.com/Project-HAMi/HAMi"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@dynamia.ai",
    "contactType": "customer service"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "Global"
  }
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Dynamia AI Platform",
  "applicationCategory": "BusinessApplication",
  "description": "Enterprise-grade heterogeneous computing platform that enables GPU sharing, auto-scaling, and unified management for AI workloads",
  "operatingSystem": "Linux",
  "offers": {
    "@type": "Offer",
    "price": "Contact for pricing",
    "priceCurrency": "USD"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Dynamia AI"
  },
  "softwareVersion": "2.0",
  "releaseNotes": "Enhanced GPU virtualization and improved resource management"
};

export const blogPostingSchema = (title: string, description: string, publishDate: string, url: string) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": title,
  "description": description,
  "image": "https://dynamia.ai/LOGO-small.svg",
  "datePublished": publishDate,
  "dateModified": publishDate,
  "author": {
    "@type": "Organization",
    "name": "Dynamia AI"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Dynamia AI",
    "logo": {
      "@type": "ImageObject",
      "url": "https://dynamia.ai/LOGO-small.svg"
    }
  },
  "url": `https://dynamia.ai${url}`,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": `https://dynamia.ai${url}`
  }
});

export const faqSchema = (faqs: Array<{question: string, answer: string}>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export default StructuredData;
