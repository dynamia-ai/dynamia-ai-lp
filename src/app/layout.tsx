import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import I18nProvider from "../components/I18nProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dynamia.ai'),
  title: {
    default: "Dynamia AI - Unified Heterogeneous Computing",
    template: "%s | Dynamia AI"
  },
  description: "Accelerate AI, HPC, and Edge workloads seamlessly with kantaloupe. Enterprise-grade GPU virtualization and resource management platform.",
  keywords: "dynamia ai, heterogeneous computing, GPU virtualization, AI infrastructure, HAMi, kantaloupe, enterprise computing",
  authors: [{ name: "Dynamia AI Team" }],
  creator: "Dynamia AI",
  publisher: "Dynamia AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/LOGO-small.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: '/LOGO-small.svg',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dynamia.ai',
    title: 'Dynamia AI - Unified Heterogeneous Computing',
    description: 'Accelerate AI, HPC, and Edge workloads seamlessly with kantaloupe. Enterprise-grade GPU virtualization and resource management platform.',
    siteName: 'Dynamia AI',
    images: [
      {
        url: '/LOGO-small.svg',
        width: 1200,
        height: 630,
        alt: 'Dynamia AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dynamia AI - Unified Heterogeneous Computing',
    description: 'Accelerate AI, HPC, and Edge workloads seamlessly with kantaloupe.',
    images: ['/LOGO-small.svg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-google-site-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  // 增强的 SEO 配置
  alternates: {
    canonical: 'https://dynamia.ai',
    languages: {
      'en-US': 'https://dynamia.ai',
      'zh-CN': 'https://dynamia.ai/zh',
    },
  },
  other: {
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Enhanced performance optimizations */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://vitals.vercel-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/LOGO-small.svg"
          as="image"
          type="image/svg+xml"
        />
        <link
          rel="preload"
          href="/fonts/geist-sans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Enhanced security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />

        {/* Optimized viewport for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Enhanced theme colors for mobile browsers */}
        <meta name="theme-color" content="#1f2937" />
        <meta name="msapplication-TileColor" content="#1f2937" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* SEO enhancements */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <meta name="google" content="notranslate" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Dynamia AI",
              "url": "https://dynamia.ai",
              "logo": "https://dynamia.ai/LOGO.svg",
              "description": "Enterprise-grade heterogeneous computing platform for AI, HPC, and Edge workloads",
              "foundingDate": "2023",
              "industry": "Software Technology",
              "sameAs": [
                "https://github.com/Project-HAMi/HAMi",
                "https://twitter.com/dynamia_ai",
                "https://linkedin.com/company/dynamia-ai"
              ]
            })
          }}
        />

        {/* Apple specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Dynamia AI" />

        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Dynamia AI",
              "url": "https://dynamia.ai",
              "logo": "https://dynamia.ai/LOGO-small.svg",
              "description": "Enterprise-grade heterogeneous computing platform for AI, HPC, and Edge workloads",
              "foundingDate": "2023",
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
            })
          }}
        />

        {/* Website structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Dynamia AI",
              "url": "https://dynamia.ai",
              "description": "Enterprise-grade heterogeneous computing platform",
              "publisher": {
                "@type": "Organization",
                "name": "Dynamia AI"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://dynamia.ai/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          {children}
          <SpeedInsights />
          <Analytics />
        </I18nProvider>
      </body>
    </html>
  );
}
