import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import StructuredData from './StructuredData';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const { t } = useTranslation();

  // Generate structured data for breadcrumbs
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": t('navigation.home'),
        "item": "https://dynamia.ai/"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": item.href ? `https://dynamia.ai${item.href}` : undefined
      }))
    ]
  };

  return (
    <>
      <StructuredData data={breadcrumbStructuredData} />
      <nav 
        aria-label="Breadcrumb" 
        className={`flex ${className}`} 
        itemScope 
        itemType="https://schema.org/BreadcrumbList"
      >
        <ol className="flex items-center space-x-2">
          {/* Home link */}
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link 
              href="/" 
              className="text-gray-400 hover:text-gray-500 flex items-center transition-colors duration-200"
              itemProp="item"
              title={t('navigation.home')}
            >
              <HomeIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only" itemProp="name">{t('navigation.home')}</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>

          {/* Breadcrumb items */}
          {items.map((item, index) => (
            <li 
              key={index} 
              className="flex items-center" 
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200"
                  itemProp="item"
                  title={item.label}
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span 
                  className="text-gray-900 text-sm font-medium" 
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              )}
              <meta itemProp="position" content={String(index + 2)} />
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb; 