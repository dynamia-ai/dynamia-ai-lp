'use client';

import Link from 'next/link';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

// Note: metadata export is not available in client components
// We'll handle SEO differently for this page

export default function NotFound() {
  useEffect(() => {
    // Set document title for SEO
    document.title = '404 - Page Not Found | Dynamia AI';
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'The page you are looking for could not be found. Return to Dynamia AI homepage or explore our products and solutions.');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = 'The page you are looking for could not be found. Return to Dynamia AI homepage or explore our products and solutions.';
      document.head.appendChild(newMeta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">DA</span>
          </div>
        </div>
        
        {/* 404 Message */}
        <div>
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for could not be found. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
        
        {/* Popular Links */}
        <div className="mt-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/products"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              Products
            </Link>
            <Link
              href="/pricing"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/solutions"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              Solutions
            </Link>
            <Link
              href="/company"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              About Us
            </Link>
          </div>
        </div>
      </div>
      
      {/* Structured Data for 404 page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "404 - Page Not Found",
            "description": "The requested page could not be found on Dynamia AI website",
            "url": "https://dynamia.ai/404",
            "isPartOf": {
              "@type": "WebSite",
              "name": "Dynamia AI",
              "url": "https://dynamia.ai"
            }
          })
        }}
      />
    </div>
  );
} 